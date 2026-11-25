import * as React from 'react';
import { useApp, NavView } from '../../context/AppContext';
import { IconButton, TooltipHost } from '@fluentui/react';

interface INavItem {
  key: NavView;
  label: string;
  iconName: string;
  badge?: string | number;
  badgeColor?: string;
  highlight?: boolean;
}

interface INavSection {
  title?: string;
  items: INavItem[];
}

export const Sidebar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    sidebarCollapsed, 
    toggleSidebar, 
    themeStyles, 
    currentTheme 
  } = useApp();

  const isDark = currentTheme === 'dark';

  const sections: INavSection[] = [
    {
      items: [
        { key: 'dashboard', label: 'Executive Dashboard', iconName: 'ViewDashboard', badge: 'Live', badgeColor: '#10b981' }
      ]
    },
    {
      title: 'PROJECT DELIVERY',
      items: [
        { key: 'projects', label: 'Projects Portfolio', iconName: 'ProjectDocument' },
        { key: 'timeline', label: 'Gantt & Roadmap', iconName: 'Timeline' },
        { key: 'tasks', label: 'Task Management', iconName: 'TaskGroup' },
        { key: 'kanban', label: 'Kanban Board', iconName: 'Tiles' }
      ]
    },
    {
      title: 'INTELLIGENCE & RISK',
      items: [
        { key: 'copilot', label: 'AI Project Copilot', iconName: 'Sparkle', highlight: true, badge: 'GPT-4', badgeColor: '#a855f7' },
        { key: 'risks', label: '5x5 Risk Heatmap', iconName: 'Warning12' },
        { key: 'financials', label: 'EVM & Cost Tracking', iconName: 'Money' }
      ]
    },
    {
      title: 'WORKSPACE & DATA',
      items: [
        { key: 'excel', label: 'Excel Bulk Ingestion', iconName: 'ExcelLogo' },
        { key: 'documents', label: 'Documents Library', iconName: 'FabricFolder' },
        { key: 'approvals', label: 'Approvals Hub', iconName: 'CheckList', badge: 'Pending', badgeColor: '#f59e0b' },
        { key: 'team', label: 'Team Capacity', iconName: 'People' }
      ]
    },
    {
      title: 'SYSTEM & REPORTING',
      items: [
        { key: 'reports', label: 'Reports & Analytics', iconName: 'BarChartVertical' },
        { key: 'settings', label: 'Dynamic Configuration', iconName: 'Settings' }
      ]
    }
  ];

  return (
    <aside
      style={{
        width: sidebarCollapsed ? '72px' : '260px',
        backgroundColor: themeStyles.bgSidebar,
        borderRight: `1px solid ${themeStyles.border}`,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        zIndex: 10,
        boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.4)' : 'none'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          padding: sidebarCollapsed ? '0' : '0 16px',
          borderBottom: `1px solid ${themeStyles.border}`,
          background: isDark
            ? 'linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, transparent 100%)'
            : 'transparent'
        }}
      >
        {!sidebarCollapsed && (
          <div 
            onClick={() => setActiveView('dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '15px',
                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.35)'
              }}
            >
              EP
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  fontSize: '15px',
                  color: themeStyles.textPrimary,
                  letterSpacing: '-0.3px',
                  lineHeight: 1.2
                }}
              >
                EnterprisePortal
              </div>
              <div style={{ fontSize: '10.5px', color: themeStyles.accentBlue, fontWeight: 600, letterSpacing: '0.4px' }}>
                SPFx M365 SAAS
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

      {/* Nav Menu Sections */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {!sidebarCollapsed && sec.title && (
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: themeStyles.textMuted,
                    padding: '8px 12px 4px 12px',
                    textTransform: 'uppercase'
                  }}
                >
                  {sec.title}
                </div>
              )}

              {sec.items.map(item => {
                const isActive = activeView === item.key;
                const buttonContent = (
                  <button
                    key={item.key}
                    onClick={() => setActiveView(item.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                      width: '100%',
                      padding: sidebarCollapsed ? '10px 0' : '9px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isActive
                        ? isDark ? 'rgba(14, 165, 233, 0.16)' : '#e0f2fe'
                        : 'transparent',
                      color: isActive
                        ? themeStyles.accentBlue
                        : themeStyles.textSecondary,
                      cursor: 'pointer',
                      outline: 'none',
                      position: 'relative',
                      transition: 'all 0.15s ease',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '13px'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';
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
                    {isActive && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '6px',
                          bottom: '6px',
                          width: '3.5px',
                          borderRadius: '0 4px 4px 0',
                          backgroundColor: themeStyles.accentBlue,
                          boxShadow: `0 0 10px ${themeStyles.accentBlue}`
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i
                        className={`ms-Icon ms-Icon--${item.iconName}`}
                        style={{
                          fontSize: '15px',
                          color: isActive
                            ? themeStyles.accentBlue
                            : item.highlight
                              ? themeStyles.accentPurple
                              : themeStyles.textSecondary,
                          transition: 'color 0.15s ease'
                        }}
                      />
                      {!sidebarCollapsed && (
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                      )}
                    </div>

                    {!sidebarCollapsed && item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '10px',
                          backgroundColor: item.badgeColor ? `${item.badgeColor}22` : 'rgba(255,255,255,0.08)',
                          color: item.badgeColor || themeStyles.accentBlue,
                          border: `1px solid ${item.badgeColor ? `${item.badgeColor}44` : 'rgba(255,255,255,0.1)'}`
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );

                if (sidebarCollapsed) {
                  return (
                    <TooltipHost key={item.key} content={item.label} calloutProps={{ gapSpace: 8 }}>
                      {buttonContent}
                    </TooltipHost>
                  );
                }

                return buttonContent;
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer / Tenant Info */}
      <div
        style={{
          padding: sidebarCollapsed ? '12px 6px' : '14px 16px',
          borderTop: `1px solid ${themeStyles.border}`,
          backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          gap: '10px'
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
            flexShrink: 0
          }}
        />
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textPrimary }}>
              SharePoint Online
            </div>
            <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>
              Production Live Tenant
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
