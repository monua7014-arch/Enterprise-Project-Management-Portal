import * as React from 'react';
import { useApp, NavView } from '../../context/AppContext';
import { 
  IconButton, 
  TooltipHost 
} from '@fluentui/react';

interface INavItem {
  key: NavView;
  label: string;
  iconName: string;
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    sidebarCollapsed, 
    toggleSidebar, 
    themeStyles, 
    unreadNotificationCount 
  } = useApp();

  const navItems: INavItem[] = [
    { key: 'dashboard', label: 'Executive Dashboard', iconName: 'ViewDashboard' },
    { key: 'projects', label: 'Projects Portfolio', iconName: 'ProjectDocument' },
    { key: 'timeline', label: 'Gantt & Roadmap', iconName: 'Timeline' },
    { key: 'tasks', label: 'Task Management', iconName: 'TaskGroup' },
    { key: 'kanban', label: 'Kanban Board', iconName: 'Tiles' },
    { key: 'risks', label: '5x5 Risk Heatmap', iconName: 'Warning12' },
    { key: 'financials', label: 'EVM & Cost Tracking', iconName: 'Money' },
    { key: 'copilot', label: 'AI Project Copilot', iconName: 'Sparkle', highlight: true },
    { key: 'excel', label: 'Excel Bulk Ingestion', iconName: 'ExcelLogo' },
    { key: 'documents', label: 'Documents Library', iconName: 'FabricFolder' },
    { key: 'approvals', label: 'Approvals Hub', iconName: 'CheckList' },
    { key: 'team', label: 'Team Capacity', iconName: 'People' },
    { key: 'reports', label: 'Reports & Export', iconName: 'BarChartVertical' },
    { key: 'settings', label: 'Dynamic Configuration', iconName: 'Settings' }
  ];

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '72px' : '260px',
        backgroundColor: themeStyles.bgSidebar,
        borderRight: `1px solid ${themeStyles.border}`,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '800px',
        userSelect: 'none',
        zIndex: 10
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '0' : '0 18px',
          borderBottom: `1px solid ${themeStyles.border}`
        }}
      >
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00a8e8 0%, #0077b6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: '16px',
                boxShadow: '0 2px 10px rgba(0, 168, 232, 0.35)'
              }}
            >
              EP
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: themeStyles.textPrimary, letterSpacing: '-0.3px' }}>
                EnterprisePortal
              </div>
              <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>
                SPFx M365 Suite
              </div>
            </div>
          </div>
        )}

        <IconButton
          iconProps={{ iconName: sidebarCollapsed ? 'DoubleChevronRight' : 'DoubleChevronLeft' }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          ariaLabel={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={toggleSidebar}
          styles={{
            root: {
              color: themeStyles.textSecondary,
              ':hover': { color: themeStyles.textPrimary, backgroundColor: themeStyles.bgCardHover }
            }
          }}
        />
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map(item => {
            const isActive = activeView === item.key;
            const content = (
              <button
                key={item.key}
                onClick={() => setActiveView(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive
                    ? 'rgba(0, 168, 232, 0.16)'
                    : item.highlight
                    ? 'rgba(139, 92, 246, 0.08)'
                    : 'transparent',
                  color: isActive
                    ? themeStyles.accentBlue
                    : item.highlight
                    ? '#a78bfa'
                    : themeStyles.textSecondary,
                  fontWeight: isActive ? 700 : item.highlight ? 600 : 500,
                  fontSize: '13px',
                  transition: 'all 0.15s ease-in-out',
                  textAlign: 'left'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = themeStyles.bgCardHover;
                    e.currentTarget.style.color = themeStyles.textPrimary;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = item.highlight ? 'rgba(139, 92, 246, 0.08)' : 'transparent';
                    e.currentTarget.style.color = item.highlight ? '#a78bfa' : themeStyles.textSecondary;
                  }
                }}
              >
                <i
                  className={`ms-Icon ms-Icon--${item.iconName}`}
                  style={{
                    fontSize: '17px',
                    color: isActive
                      ? themeStyles.accentBlue
                      : item.highlight
                      ? '#a78bfa'
                      : themeStyles.textSecondary,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}
                />

                {!sidebarCollapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}

                {!sidebarCollapsed && item.highlight && (
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                      color: '#fff',
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px'
                    }}
                  >
                    AI
                  </span>
                )}
              </button>
            );

            if (sidebarCollapsed) {
              return (
                <TooltipHost key={item.key} content={item.label} delay={0}>
                  {content}
                </TooltipHost>
              );
            }

            return content;
          })}
        </div>
      </nav>

      {/* Footer / System Status */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: `1px solid ${themeStyles.border}`,
          fontSize: '11px',
          color: themeStyles.textMuted
        }}
      >
        {!sidebarCollapsed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: themeStyles.accentGreen,
                    display: 'inline-block'
                  }}
                />
                <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>SharePoint Online</span>
              </div>
              <span style={{ fontSize: '10px', color: themeStyles.accentBlue, fontWeight: 700 }}>SPFx 1.18.2</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <span>Press <strong style={{ color: themeStyles.textPrimary }}>Ctrl + K</strong></span>
              <span>Command Bar</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: themeStyles.accentGreen,
                display: 'inline-block'
              }}
              title="SharePoint Connected (Ctrl+K for commands)"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
