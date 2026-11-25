import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { 
  IUserRef, 
  IListMappingConfig, 
  INotificationItem 
} from '../models';
import { 
  AppThemeMode, 
  getThemeStyles 
} from '../styles/theme';

export type NavView = 
  | 'dashboard' 
  | 'projects' 
  | 'project-detail'
  | 'timeline'
  | 'tasks' 
  | 'kanban' 
  | 'excel' 
  | 'documents' 
  | 'approvals' 
  | 'team' 
  | 'risks'
  | 'financials'
  | 'copilot'
  | 'reports' 
  | 'settings';

export interface IToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface IAppContextType {
  spContext: WebPartContext;
  currentUser: IUserRef;
  currentTheme: AppThemeMode;
  themeStyles: ReturnType<typeof getThemeStyles>;
  toggleTheme: () => void;
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  config: IListMappingConfig;
  updateConfig: (cfg: Partial<IListMappingConfig>) => void;
  notifications: INotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: number) => void;
  toasts: IToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  removeToast: (id: string) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DEFAULT_CONFIG: IListMappingConfig = {
  projectsList: 'Projects',
  tasksList: 'ProjectTasks',
  milestonesList: 'ProjectMilestones',
  approvalsList: 'ProjectApprovals',
  teamList: 'ProjectTeam',
  documentsLib: 'ProjectDocuments',
  activityLogsList: 'ProjectActivityLogs',
  notificationsList: 'ProjectNotifications',
  fieldMappings: {
    Projects: {
      projectId: 'ProjectID',
      title: 'Title',
      description: 'ProjectDescription',
      clientName: 'ClientName',
      projectManager: 'ProjectManager',
      startDate: 'StartDate',
      endDate: 'EndDate',
      budget: 'ProjectBudget',
      status: 'ProjectStatus',
      priority: 'Priority',
      progress: 'ProjectProgress',
      assignedTeam: 'AssignedTeam'
    },
    ProjectTasks: {
      taskId: 'TaskID',
      projectId: 'ProjectLookupId',
      title: 'Title',
      description: 'TaskDescription',
      assignedTo: 'AssignedTo',
      startDate: 'StartDate',
      dueDate: 'DueDate',
      priority: 'Priority',
      status: 'TaskStatus',
      completionPercentage: 'CompletionPercentage'
    }
  }
};

const AppContext = createContext<IAppContextType | undefined>(undefined);

export interface IAppProviderProps {
  spContext: WebPartContext;
  children: React.ReactNode;
}

export const AppProvider: React.FC<IAppProviderProps> = ({ spContext, children }) => {
  const [currentTheme, setCurrentTheme] = useState<AppThemeMode>('dark');
  const [activeView, setActiveView] = useState<NavView>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [config, setConfig] = useState<IListMappingConfig>(DEFAULT_CONFIG);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [toasts, setToasts] = useState<IToastMessage[]>([]);

  const [notifications, setNotifications] = useState<INotificationItem[]>([
    {
      id: 1,
      title: 'Welcome to Enterprise Portal',
      message: 'Portal initialized and connected to SharePoint.',
      type: 'System',
      isRead: false,
      created: new Date().toISOString()
    }
  ]);

  const currentUser: IUserRef = {
    id: spContext.pageContext?.user?.displayName ? 1 : 0,
    title: spContext.pageContext?.user?.displayName || 'Enterprise User',
    email: spContext.pageContext?.user?.email || 'user@tenant.sharepoint.com',
    jobTitle: 'Project Director',
    pictureUrl: `/_layouts/15/userphoto.aspx?size=M&accountname=${spContext.pageContext?.user?.email || ''}`
  };

  const themeStyles = getThemeStyles(currentTheme === 'dark');

  const toggleTheme = (): void => {
    setCurrentTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = (): void => {
    setSidebarCollapsed(prev => !prev);
  };

  const updateConfig = (cfg: Partial<IListMappingConfig>): void => {
    setConfig(prev => ({ ...prev, ...cfg }));
  };

  const triggerRefresh = (): void => {
    setRefreshTrigger(prev => prev + 1);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success'): void => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string): void => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markNotificationAsRead = (id: number): void => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const unreadNotificationCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppContext.Provider
      value={{
        spContext,
        currentUser,
        currentTheme,
        themeStyles,
        toggleTheme,
        activeView,
        setActiveView,
        selectedProjectId,
        setSelectedProjectId,
        sidebarCollapsed,
        toggleSidebar,
        globalSearch,
        setGlobalSearch,
        config,
        updateConfig,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        toasts,
        showToast,
        removeToast,
        refreshTrigger,
        triggerRefresh
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): IAppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
