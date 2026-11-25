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
    { key: 'projects', label: 'Projects', iconName: 'ProjectDocument' },
    { key: 'tasks', label: 'Task List', iconName: 'TaskGroup' },
    { key: 'kanban', label: 'Kanban Board', iconName: 'Tiles' },
    { key: 'excel', label: 'Excel Bulk Upload', iconName: 'ExcelLogo' },
    { key: 'documents', label: 'Documents', iconName: 'FabricFolder' },
    { key: 'approvals', label: 'Approvals', iconName: 'CheckList' },
    { key: 'team', label: 'Team Allocation', iconName: 'People' },
    { key: 'reports', label: 'Reports & Analytics', iconName: 'BarChartVertical' },
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
      <nav style={{ flex: 1, padding: '16px 8px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  padding: sidebarCollapsed ? '10px 0' : '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive
                    ? 'rgba(0, 168, 232, 0.16)'
                    : 'transparent',
                  color: isActive ? themeStyles.accentBlue : themeStyles.textSecondary,
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13.5px',
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
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = themeStyles.textSecondary;
                  }
                }}
              >
                <i
                  className={`ms-Icon ms-Icon--${item.iconName}`}
                  style={{
                    fontSize: '18px',
                    color: isActive ? themeStyles.accentBlue : themeStyles.textSecondary,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}
                />

                {!sidebarCollapsed && (
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                )}

                {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    style={{
                      backgroundColor: themeStyles.accentAmber,
                      color: '#000',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '10px'
                    }}
                  >
                    {item.badge}
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
          padding: '16px',
          borderTop: `1px solid ${themeStyles.border}`,
          fontSize: '12px',
          color: themeStyles.textMuted
        }}
      >
        {!sidebarCollapsed ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: themeStyles.accentGreen,
                  display: 'inline-block'
                }}
              />
              <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>SharePoint Online</span>
            </div>
            <div>SPFx 1.18.2 | React 17</div>
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
              title="SharePoint Connected"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
