import { SharePointService } from './SharePointService';
import { ITaskItem, IListMappingConfig, TaskStatus } from '../models';
import { INITIAL_TASKS } from './MockData';
import { ProjectService } from './ProjectService';

export class TaskService {
  private static instance: TaskService;
  private memoryTasks: ITaskItem[] = [...INITIAL_TASKS];

  private constructor() {}

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  public async getTasks(config: IListMappingConfig, projectId?: number): Promise<ITaskItem[]> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.tasksList || 'ProjectTasks';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          let query = sp.web.lists.getByTitle(listName).items
            .select(
              'Id',
              'Title',
              'TaskID',
              'TaskDescription',
              'StartDate',
              'DueDate',
              'Priority',
              'TaskStatus',
              'CompletionPercentage',
              'ProjectLookup/Id',
              'ProjectLookup/Title',
              'AssignedTo/Id',
              'AssignedTo/Title',
              'AssignedTo/EMail',
              'Created',
              'Modified'
            )
            .expand('ProjectLookup', 'AssignedTo')
            .top(500);

          if (projectId) {
            query = query.filter(`ProjectLookup/Id eq ${projectId}`);
          }

          const items = await query();
          return items.map(i => ({
            id: i.Id,
            taskId: i.TaskID || `TSK-${i.Id}`,
            projectId: i.ProjectLookup ? i.ProjectLookup.Id : 0,
            projectTitle: i.ProjectLookup ? i.ProjectLookup.Title : '',
            title: i.Title,
            description: i.TaskDescription || '',
            assignedTo: i.AssignedTo ? {
              id: i.AssignedTo.Id,
              title: i.AssignedTo.Title,
              email: i.AssignedTo.EMail
            } : null,
            startDate: i.StartDate || new Date().toISOString(),
            dueDate: i.DueDate || new Date().toISOString(),
            priority: i.Priority || 'Medium',
            status: i.TaskStatus || 'To Do',
            completionPercentage: Number(i.CompletionPercentage) || 0,
            created: i.Created,
            modified: i.Modified
          }));
        }
      } catch (err) {
        console.warn('[TaskService] Could not retrieve SharePoint tasks. Returning local store.', err);
      }
    }

    if (projectId) {
      return this.memoryTasks.filter(t => t.projectId === projectId);
    }
    return [...this.memoryTasks];
  }

  public async createTask(task: Omit<ITaskItem, 'id'>, config: IListMappingConfig): Promise<ITaskItem> {
    const spService = SharePointService.getInstance();
    let newId = Date.now();

    if (spService.isConnected()) {
      try {
        const listName = config.tasksList || 'ProjectTasks';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          const itemPayload: any = {
            Title: task.title,
            TaskID: task.taskId,
            TaskDescription: task.description,
            StartDate: task.startDate,
            DueDate: task.dueDate,
            Priority: task.priority,
            TaskStatus: task.status,
            CompletionPercentage: task.completionPercentage,
            ProjectLookupId: task.projectId
          };
          if (task.assignedTo?.id) {
            itemPayload.AssignedToId = task.assignedTo.id;
          }
          const res = await sp.web.lists.getByTitle(listName).items.add(itemPayload);
          newId = res.data.Id;
        }
      } catch (err) {
        console.warn('[TaskService] Failed to create SharePoint task item. Using memory store.', err);
      }
    }

    const created: ITaskItem = {
      ...task,
      id: newId,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };
    this.memoryTasks.unshift(created);
    ProjectService.getInstance().logActivity(task.projectId, 'Task Created', `Task '${task.title}' created.`);
    return created;
  }

  public async updateTask(id: number, updates: Partial<ITaskItem>, config: IListMappingConfig): Promise<ITaskItem> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.tasksList || 'ProjectTasks';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          const itemPayload: any = {};
          if (updates.title) itemPayload.Title = updates.title;
          if (updates.taskId) itemPayload.TaskID = updates.taskId;
          if (updates.description !== undefined) itemPayload.TaskDescription = updates.description;
          if (updates.startDate) itemPayload.StartDate = updates.startDate;
          if (updates.dueDate) itemPayload.DueDate = updates.dueDate;
          if (updates.priority) itemPayload.Priority = updates.priority;
          if (updates.status) itemPayload.TaskStatus = updates.status;
          if (updates.completionPercentage !== undefined) itemPayload.CompletionPercentage = updates.completionPercentage;
          if (updates.projectId) itemPayload.ProjectLookupId = updates.projectId;
          if (updates.assignedTo?.id) itemPayload.AssignedToId = updates.assignedTo.id;

          await sp.web.lists.getByTitle(listName).items.getById(id).update(itemPayload);
        }
      } catch (err) {
        console.warn(`[TaskService] Could not update SharePoint task ${id}:`, err);
      }
    }

    const idx = this.memoryTasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.memoryTasks[idx] = {
        ...this.memoryTasks[idx],
        ...updates,
        modified: new Date().toISOString()
      };
      ProjectService.getInstance().logActivity(this.memoryTasks[idx].projectId, 'Task Updated', `Task '${this.memoryTasks[idx].title}' updated.`);
      return this.memoryTasks[idx];
    }
    throw new Error(`Task with id ${id} not found.`);
  }

  public async updateTaskStatus(id: number, newStatus: TaskStatus, config: IListMappingConfig): Promise<void> {
    let completion = 0;
    if (newStatus === 'Completed') completion = 100;
    else if (newStatus === 'Under Review') completion = 85;
    else if (newStatus === 'In Progress') completion = 50;

    await this.updateTask(id, { status: newStatus, completionPercentage: completion }, config);
  }

  public async deleteTask(id: number, config: IListMappingConfig): Promise<boolean> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.tasksList || 'ProjectTasks';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          await sp.web.lists.getByTitle(listName).items.getById(id).delete();
        }
      } catch (err) {
        console.warn(`[TaskService] Could not delete SharePoint task ${id}:`, err);
      }
    }

    const found = this.memoryTasks.find(t => t.id === id);
    if (found) {
      ProjectService.getInstance().logActivity(found.projectId, 'Task Deleted', `Task '${found.title}' removed.`);
    }
    this.memoryTasks = this.memoryTasks.filter(t => t.id !== id);
    return true;
  }
}
