import * as React from 'react';
import { ThemeProvider } from '@fluentui/react';
import { AppProvider, useApp } from '../context/AppContext';
import { darkNavyTheme, lightSaasTheme } from '../styles/theme';
import { Sidebar } from './Navigation/Sidebar';
import { Header } from './Navigation/Header';
import { ExecutiveDashboard } from './Dashboard/ExecutiveDashboard';
import { ProjectList, ProjectDetail } from './Projects';
import { TaskList, KanbanBoard } from './Tasks';
import { ExcelBulkUpload } from './ExcelUpload';
import { DocumentManager } from './Documents';
import { ApprovalManager } from './Approvals';
import { TeamManager } from './Team';
import { ReportsDashboard } from './Reports';
import { DynamicConfig } from './Settings/DynamicConfig';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IAppProps {
  context: WebPartContext;
}

const PortalMainContent: React.FC = () => {
  const { activeView, themeStyles } = useApp();

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ExecutiveDashboard />;
      case 'projects':
        return <ProjectList />;
      case 'project-detail':
        return <ProjectDetail />;
      case 'tasks':
        return <TaskList />;
      case 'kanban':
        return <KanbanBoard />;
      case 'excel':
        return <ExcelBulkUpload />;
      case 'documents':
        return <DocumentManager />;
      case 'approvals':
        return <ApprovalManager />;
      case 'team':
        return <TeamManager />;
      case 'reports':
        return <ReportsDashboard />;
      case 'settings':
        return <DynamicConfig />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: themeStyles.bgApp,
        overflow: 'hidden',
        fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <Header />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px'
          }}
        >
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export const AppContentWrapper: React.FC = () => {
  const { currentTheme } = useApp();
  const theme = currentTheme === 'dark' ? darkNavyTheme : lightSaasTheme;

  return (
    <ThemeProvider theme={theme} applyTo="element" style={{ width: '100%', height: '100%' }}>
      <PortalMainContent />
    </ThemeProvider>
  );
};

export const App: React.FC<IAppProps> = ({ context }) => {
  return (
    <AppProvider spContext={context}>
      <AppContentWrapper />
    </AppProvider>
  );
};

export default App;
