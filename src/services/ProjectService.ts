import { SharePointService } from './SharePointService';
import { IProjectItem, IMilestoneItem, IListMappingConfig, IActivityLogItem } from '../models';
import { INITIAL_PROJECTS, INITIAL_MILESTONES, INITIAL_ACTIVITY_LOGS } from './MockData';

export class ProjectService {
  private static instance: ProjectService;
  private memoryProjects: IProjectItem[] = [...INITIAL_PROJECTS];
  private memoryMilestones: IMilestoneItem[] = [...INITIAL_MILESTONES];
  private memoryLogs: IActivityLogItem[] = [...INITIAL_ACTIVITY_LOGS];

  private constructor() {}

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  public async getProjects(config: IListMappingConfig): Promise<IProjectItem[]> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.projectsList || 'Projects';
        const exists = await spService.checkListExists(listName);
        if (exists) {
          const sp = spService.getSP();
          const items = await sp.web.lists.getByTitle(listName).items
            .select(
              'Id',
              'Title',
              'ProjectID',
              'ProjectDescription',
              'ClientName',
              'StartDate',
              'EndDate',
              'ProjectBudget',
              'ProjectStatus',
              'Priority',
              'ProjectProgress',
              'ProjectManager/Id',
              'ProjectManager/Title',
              'ProjectManager/EMail',
              'Created',
              'Modified'
            )
            .expand('ProjectManager')
            .top(500)();

          return items.map(i => ({
            id: i.Id,
            projectId: i.ProjectID || `PRJ-${i.Id}`,
            title: i.Title,
            description: i.ProjectDescription || '',
            clientName: i.ClientName || 'Internal',
            projectManager: i.ProjectManager ? {
              id: i.ProjectManager.Id,
              title: i.ProjectManager.Title,
              email: i.ProjectManager.EMail
            } : null,
            startDate: i.StartDate || new Date().toISOString(),
            endDate: i.EndDate || new Date().toISOString(),
            budget: Number(i.ProjectBudget) || 0,
            status: i.ProjectStatus || 'Planning',
            priority: i.Priority || 'Medium',
            progress: Number(i.ProjectProgress) || 0,
            assignedTeam: [],
            created: i.Created,
            modified: i.Modified
          }));
        }
      } catch (err) {
        console.warn('[ProjectService] Could not retrieve SharePoint list items. Returning memory store.', err);
      }
    }
    return [...this.memoryProjects];
  }

  public async getProjectById(id: number, config: IListMappingConfig): Promise<IProjectItem | null> {
    const list = await this.getProjects(config);
    return list.find(p => p.id === id) || null;
  }

  public async createProject(project: Omit<IProjectItem, 'id'>, config: IListMappingConfig): Promise<IProjectItem> {
    const spService = SharePointService.getInstance();
    let newId = Date.now();

    if (spService.isConnected()) {
      try {
        const listName = config.projectsList || 'Projects';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          const itemPayload: any = {
            Title: project.title,
            ProjectID: project.projectId,
            ProjectDescription: project.description,
            ClientName: project.clientName,
            StartDate: project.startDate,
            EndDate: project.endDate,
            ProjectBudget: project.budget,
            ProjectStatus: project.status,
            Priority: project.priority,
            ProjectProgress: project.progress
          };
          if (project.projectManager?.id) {
            itemPayload.ProjectManagerId = project.projectManager.id;
          }
          const res = await sp.web.lists.getByTitle(listName).items.add(itemPayload);
          newId = res.data.Id;
        }
      } catch (err) {
        console.warn('[ProjectService] Failed to add to SharePoint list. Adding to local store.', err);
      }
    }

    const created: IProjectItem = {
      ...project,
      id: newId,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    this.memoryProjects.unshift(created);
    this.logActivity(created.id, 'Project Created', `New project '${created.title}' created.`);
    return created;
  }

  public async updateProject(id: number, updates: Partial<IProjectItem>, config: IListMappingConfig): Promise<IProjectItem> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.projectsList || 'Projects';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          const itemPayload: any = {};
          if (updates.title) itemPayload.Title = updates.title;
          if (updates.projectId) itemPayload.ProjectID = updates.projectId;
          if (updates.description !== undefined) itemPayload.ProjectDescription = updates.description;
          if (updates.clientName) itemPayload.ClientName = updates.clientName;
          if (updates.startDate) itemPayload.StartDate = updates.startDate;
          if (updates.endDate) itemPayload.EndDate = updates.endDate;
          if (updates.budget !== undefined) itemPayload.ProjectBudget = updates.budget;
          if (updates.status) itemPayload.ProjectStatus = updates.status;
          if (updates.priority) itemPayload.Priority = updates.priority;
          if (updates.progress !== undefined) itemPayload.ProjectProgress = updates.progress;
          if (updates.projectManager?.id) itemPayload.ProjectManagerId = updates.projectManager.id;

          await sp.web.lists.getByTitle(listName).items.getById(id).update(itemPayload);
        }
      } catch (err) {
        console.warn(`[ProjectService] Could not update SharePoint item ${id}:`, err);
      }
    }

    const idx = this.memoryProjects.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.memoryProjects[idx] = {
        ...this.memoryProjects[idx],
        ...updates,
        modified: new Date().toISOString()
      };
      this.logActivity(id, 'Project Updated', `Project details updated.`);
      return this.memoryProjects[idx];
    }
    throw new Error(`Project with id ${id} not found.`);
  }

  public async deleteProject(id: number, config: IListMappingConfig): Promise<boolean> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.projectsList || 'Projects';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          await sp.web.lists.getByTitle(listName).items.getById(id).delete();
        }
      } catch (err) {
        console.warn(`[ProjectService] Could not delete SharePoint item ${id}:`, err);
      }
    }

    this.memoryProjects = this.memoryProjects.filter(p => p.id !== id);
    this.memoryMilestones = this.memoryMilestones.filter(m => m.projectId !== id);
    this.logActivity(id, 'Project Deleted', `Project ID ${id} was removed.`);
    return true;
  }

  // Milestones
  public async getMilestones(projectId: number, config: IListMappingConfig): Promise<IMilestoneItem[]> {
    return this.memoryMilestones.filter(m => m.projectId === projectId);
  }

  public async addMilestone(milestone: Omit<IMilestoneItem, 'id'>, config: IListMappingConfig): Promise<IMilestoneItem> {
    const newMilestone: IMilestoneItem = {
      ...milestone,
      id: Date.now()
    };
    this.memoryMilestones.push(newMilestone);
    this.logActivity(milestone.projectId, 'Milestone Added', `Milestone '${milestone.title}' added.`);
    return newMilestone;
  }

  public async updateMilestone(id: number, updates: Partial<IMilestoneItem>, config: IListMappingConfig): Promise<void> {
    const idx = this.memoryMilestones.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.memoryMilestones[idx] = { ...this.memoryMilestones[idx], ...updates };
    }
  }

  public async deleteMilestone(id: number, config: IListMappingConfig): Promise<void> {
    this.memoryMilestones = this.memoryMilestones.filter(m => m.id !== id);
  }

  // Activity Logs
  public getActivities(projectId?: number): IActivityLogItem[] {
    if (projectId) {
      return this.memoryLogs.filter(l => l.projectId === projectId);
    }
    return [...this.memoryLogs].reverse();
  }

  public logActivity(projectId: number, action: string, details: string): void {
    const log: IActivityLogItem = {
      id: Date.now(),
      projectId,
      action,
      details,
      performedBy: 'Current User',
      timestamp: new Date().toISOString()
    };
    this.memoryLogs.push(log);
  }
}
