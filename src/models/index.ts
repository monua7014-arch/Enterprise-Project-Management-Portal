export interface IUserRef {
  id: number;
  title: string;
  email: string;
  jobTitle?: string;
  pictureUrl?: string;
}

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Delayed' | 'Completed' | 'Cancelled';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'To Do' | 'In Progress' | 'Under Review' | 'Completed';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type DocumentCategory = 'Requirements' | 'Architecture' | 'Design' | 'Contract' | 'Deliverable' | 'Meeting Notes' | 'Other';
export type TeamRole = 'Project Manager' | 'Technical Lead' | 'Senior Developer' | 'Frontend Developer' | 'Backend Developer' | 'QA Engineer' | 'DevOps Engineer' | 'Business Analyst';

export interface ISubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ITaskComment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: string;
}

export interface IProjectItem {
  id: number;
  projectId: string; // e.g. "PRJ-101"
  title: string;
  description: string;
  clientName: string;
  projectManager: IUserRef | null;
  startDate: string; // ISO string
  endDate: string; // ISO string
  budget: number;
  status: ProjectStatus;
  priority: PriorityLevel;
  progress: number; // 0 to 100
  assignedTeam: IUserRef[];
  actualSpend?: number;
  healthScore?: number; // 0 to 100
  created?: string;
  modified?: string;
}

export interface ITaskItem {
  id: number;
  taskId: string; // e.g. "TSK-201"
  projectId: number; // Foreign key to Project id
  projectTitle?: string;
  title: string;
  description: string;
  assignedTo: IUserRef | null;
  startDate: string;
  dueDate: string;
  priority: PriorityLevel;
  status: TaskStatus;
  completionPercentage: number;
  subtasks?: ISubTask[];
  comments?: ITaskComment[];
  dependencies?: number[]; // task IDs this task depends on
  created?: string;
  modified?: string;
}

export interface IMilestoneItem {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  completedDate?: string;
}

export interface IRiskItem {
  id: number;
  projectId: number;
  projectTitle?: string;
  title: string;
  description: string;
  probability: 1 | 2 | 3 | 4 | 5; // 1 = Low, 5 = Critical
  impact: 1 | 2 | 3 | 4 | 5; // 1 = Low, 5 = Critical
  score: number; // probability * impact
  status: 'Identified' | 'Analyzing' | 'Mitigating' | 'Accepted' | 'Closed';
  category: 'Technical' | 'Schedule' | 'Budget' | 'Resource' | 'Security';
  owner: string;
  mitigationPlan: string;
}

export interface IFinancialMetric {
  projectId: number;
  projectTitle: string;
  plannedValue: number; // PV
  earnedValue: number; // EV
  actualCost: number; // AC
  costVariance: number; // CV = EV - AC
  scheduleVariance: number; // SV = EV - PV
  cpi: number; // Cost Performance Index = EV / AC
  spi: number; // Schedule Performance Index = EV / PV
  forecastedEAC: number; // Estimate at Completion
}

export interface IApprovalItem {
  id: number;
  itemType: 'Project' | 'Task';
  itemId: number;
  itemTitle: string;
  requestedBy: IUserRef;
  approver: IUserRef;
  status: ApprovalStatus;
  submissionDate: string;
  decisionDate?: string;
  comments?: string;
  powerAutomateRunId?: string;
}

export interface IDocumentItem {
  id: number;
  name: string;
  title: string;
  serverRelativeUrl: string;
  fileSize: number;
  modified: string;
  author: string;
  projectId?: number;
  projectTitle?: string;
  category: DocumentCategory;
  versionLabel?: string;
}

export interface ITeamMemberItem {
  id: number;
  projectId: number;
  user: IUserRef;
  role: TeamRole;
  allocationPercentage: number;
  assignedDate: string;
}

export interface IActivityLogItem {
  id: number;
  projectId?: number;
  taskId?: number;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface INotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'Deadline' | 'Overdue' | 'Approval' | 'NewProject' | 'System';
  isRead: boolean;
  created: string;
  linkUrl?: string;
}

export interface IListMappingConfig {
  projectsList: string;
  tasksList: string;
  milestonesList: string;
  approvalsList: string;
  teamList: string;
  documentsLib: string;
  activityLogsList: string;
  notificationsList: string;
  powerAutomateWebhookUrl?: string;
  fieldMappings: {
    [entity: string]: {
      [logicalField: string]: string;
    };
  };
}

export interface ISPListInfo {
  id: string;
  title: string;
  itemCount: number;
  baseTemplate: number;
  hidden: boolean;
  defaultViewUrl: string;
}

export interface ISPFieldInfo {
  id: string;
  internalName: string;
  title: string;
  typeAsString: string;
  required: boolean;
  readOnly: boolean;
  choices?: string[];
}

export interface IDashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  delayedProjects: number;
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  pendingApprovals: number;
  totalBudget: number;
  averageProgress: number;
  totalRisks?: number;
  averageHealthScore?: number;
}
