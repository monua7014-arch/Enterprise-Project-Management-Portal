import * as XLSX from 'xlsx';
import { IProjectItem, ITaskItem, IDashboardMetrics } from '../models';

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  public calculateMetrics(projects: IProjectItem[], tasks: ITaskItem[], pendingApprovalsCount: number): IDashboardMetrics {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'Active').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const delayedProjects = projects.filter(p => p.status === 'Delayed').length;

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status !== 'Completed').length;
    
    const now = new Date().getTime();
    const overdueTasks = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < now).length;

    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const averageProgress = totalProjects > 0
      ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / totalProjects)
      : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalTasks,
      pendingTasks,
      overdueTasks,
      pendingApprovals: pendingApprovalsCount,
      totalBudget,
      averageProgress
    };
  }

  public exportProjectsToExcel(projects: IProjectItem[]): void {
    const exportData = projects.map(p => ({
      'Project ID': p.projectId,
      'Project Name': p.title,
      'Client': p.clientName,
      'Manager': p.projectManager?.title || 'Unassigned',
      'Start Date': p.startDate ? new Date(p.startDate).toLocaleDateString() : '',
      'End Date': p.endDate ? new Date(p.endDate).toLocaleDateString() : '',
      'Budget ($)': p.budget,
      'Status': p.status,
      'Priority': p.priority,
      'Progress (%)': `${p.progress}%`,
      'Description': p.description
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ProjectsReport');
    XLSX.writeFile(wb, `Enterprise_Projects_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  public exportTasksToExcel(tasks: ITaskItem[]): void {
    const exportData = tasks.map(t => ({
      'Task ID': t.taskId,
      'Title': t.title,
      'Project': t.projectTitle || `Project #${t.projectId}`,
      'Assigned To': t.assignedTo?.title || 'Unassigned',
      'Start Date': t.startDate ? new Date(t.startDate).toLocaleDateString() : '',
      'Due Date': t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      'Status': t.status,
      'Priority': t.priority,
      'Completion (%)': `${t.completionPercentage}%`,
      'Description': t.description
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'TasksReport');
    XLSX.writeFile(wb, `Enterprise_Tasks_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}
