import * as React from 'react';
import { useApp, NavView } from '../../context/AppContext';
import { IconButton, TooltipHost } from '@fluentui/react';

interface INavItem {
  key: NavView;
  label: string;
  iconName: string;
  badge?: number;
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
        { key: 'dashboard', label: 'Executive Dashboard', iconName: 'ViewDashboard' }
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
        { key: 'copilot', label: 'AI Project Copilot', iconName: 'Sparkle', highlight: true },
        { key: 'risks', label: '5x5 Risk Heatmap', iconName: 'Warning12' },
        { key: 'financials', label: 'EVM & Cost Tracking', iconName: 'Money' }
      ]
    },
    {
      title: 'WORKSPACE & DATA',
      items: [
        { key: 'excel', label: 'Excel Bulk Ingestion', iconName: 'ExcelLogo' },
        { key: 'documents', label: 'Documents Library', iconName: 'FabricFolder' },
        { key: 'approvals', label: 'Approvals Hub', iconName: 'CheckList' },
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
        width: sidebarCollapsed ? '72px' : '264px',
        backgroundColor: themeStyles.bgSidebar,
        borderRight: `1px solid ${themeStyles.border}`,
        transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '800px',
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
          padding: sidebarCollapsed ? '0' : '0 18px',
          borderBottom: `1px solid ${themeStyles.border}`,
          background: isDark
            ? 'linear-gradient(180deg, rgba(14, 165, 233, 0.05) 0%, transparent 100%)'
            : 'transparent'
        }}
      >
        {!sidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                fontSize: '16px',
                boxShadow: '0 4px 16px rgba(14, 165, 233, 0.4)'
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
                SPFx M365 SUITE
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
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {!sidebarCollapsed && sec.title && (
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.8px',
                    color: themeStyles.textMuted,
                    padding: '6px 12px 3px 12px',
                    textTransform: 'uppercase'
                  }}
                >
                  {sec.title}
                </div>
              )}

              {sec.items.map(item => {
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
                        ? isDark
                          ? 'rgba(14, 165, 233, 0.14)'
                          : 'rgba(2, 132, 199, 0.1)'
                        : item.highlight
                        ? isDark
                          ? 'rgba(168, 85, 247, 0.08)'
                          : 'rgba(168, 85, 247, 0.06)'
                        : 'transparent',
                      color: isActive
                        ? themeStyles.accentBlue
                        : item.highlight
                        ? '#c084fc'
                        : themeStyles.textSecondary,
                      fontWeight: isActive ? 700 : item.highlight ? 600 : 500,
                      fontSize: '13px',
                      transition: 'all 0.15s ease-in-out',
                      textAlign: 'left',
                      position: 'relative'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = themeStyles.bgCardHover;
                        e.currentTarget.style.color = themeStyles.textPrimary;
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = item.highlight
                          ? isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.06)'
                          : 'transparent';
                        e.currentTarget.style.color = item.highlight ? '#c084fc' : themeStyles.textSecondary;
                      }
                    }}
                  >
                    {/* Active Left Indicator Bar */}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '0px',
                          top: '6px',
                          bottom: '6px',
                          width: '3px',
                          backgroundColor: themeStyles.accentBlue,
                          borderRadius: '0 4px 4px 0',
                          boxShadow: `0 0 10px ${themeStyles.accentBlue}`
                        }}
                      />
                    )}

                    <i
                      className={`ms-Icon ms-Icon--${item.iconName}`}
                      style={{
                        fontSize: '17px',
                        color: isActive
                          ? themeStyles.accentBlue
                          : item.highlight
                          ? '#c084fc'
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
                          background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                          color: '#fff',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          boxShadow: '0 2px 6px rgba(168, 85, 247, 0.35)'
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
          ))}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: themeStyles.accentGreen,
                    boxShadow: `0 0 8px ${themeStyles.accentGreen}`
                  }}
                  className="pulse-dot"
                />
                <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>SharePoint Online</span>
              </div>
              <span
                style={{
                  fontSize: '10px',
                  color: themeStyles.accentBlue,
                  fontWeight: 700,
                  backgroundColor: 'rgba(14, 165, 233, 0.12)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                v1.18.2
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', color: themeStyles.textMuted }}>
              <span>Shortcut Command</span>
              <span
                style={{
                  backgroundColor: themeStyles.bgCardHover,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  color: themeStyles.textPrimary,
                  border: `1px solid ${themeStyles.border}`
                }}
              >
                Ctrl + K
              </span>
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
                display: 'inline-block',
                boxShadow: `0 0 8px ${themeStyles.accentGreen}`
              }}
              className="pulse-dot"
              title="SharePoint Connected (Ctrl+K for commands)"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
