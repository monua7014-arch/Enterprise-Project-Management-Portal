import * as React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  SearchBox, 
  IconButton, 
  Persona, 
  PersonaSize, 
  Callout, 
  DirectionalHint,
  MessageBar,
  MessageBarType
} from '@fluentui/react';

export const Header: React.FC = () => {
  const { 
    activeView, 
    setActiveView,
    currentUser, 
    currentTheme, 
    toggleTheme, 
    themeStyles, 
    globalSearch, 
    setGlobalSearch,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    toasts,
    removeToast
  } = useApp();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [notificationButtonEl, setNotificationButtonEl] = useState<HTMLElement | null>(null);

  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Executive Project Dashboard';
      case 'projects': return 'Project Portfolio Management';
      case 'project-detail': return 'Project Details & Milestones';
      case 'timeline': return 'Interactive Gantt Schedule & Roadmap';
      case 'tasks': return 'Enterprise Task Management';
      case 'kanban': return 'Interactive Kanban Workflow';
      case 'risks': return '5x5 Quantitative Risk Heatmap Matrix';
      case 'financials': return 'EVM Financials & Budget Burn-Down';
      case 'copilot': return 'AI Project Copilot & Delivery Intelligence';
      case 'excel': return 'Excel Bulk Ingestion & Validation';
      case 'documents': return 'Document Management Library';
      case 'approvals': return 'Governance & Approvals Hub';
      case 'team': return 'Team Allocation & Capacity';
      case 'reports': return 'Reports & Analytics Export';
      case 'settings': return 'Dynamic Schema Discovery & Configuration';
      default: return 'Enterprise Portal';
    }
  };

  const getSubtitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Real-time telemetry, portfolio KPIs, and delivery progress';
      case 'projects': return 'Live portfolio records with multi-column filtering, pagination, and health analytics';
      case 'timeline': return 'Multi-project Gantt roadmap with milestone markers, timescale zoom, and dependencies';
      case 'copilot': return 'Azure OpenAI intelligence assistant with automated WBS generation';
      case 'risks': return 'PMI-standard quantitative Probability vs. Impact matrix';
      case 'financials': return 'Earned Value Management, CPI/SPI efficiency, and cost variance';
      case 'excel': return 'Client-side SheetJS bulk upload with row-by-row error detection';
      case 'kanban': return 'Drag-and-drop workflow status synchronized with SharePoint lists';
      default: return 'Microsoft 365 SharePoint Online Enterprise Environment';
    }
  };

  return (
    <>
      <header
        style={{
          height: '68px',
          backgroundColor: themeStyles.bgHeader,
          borderBottom: `1px solid ${themeStyles.border}`,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}
      >
        {/* Left: View Title & Breadcrumbs */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              onClick={() => setActiveView('dashboard')}
              style={{ fontSize: '11px', color: themeStyles.textMuted, cursor: 'pointer', fontWeight: 600 }}
            >
              PORTAL
            </span>
            <span style={{ fontSize: '10px', color: themeStyles.textMuted }}>/</span>
            <span style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 700, textTransform: 'uppercase' }}>
              {activeView}
            </span>
          </div>
          <h1
            style={{
              margin: '2px 0 0 0',
              fontSize: '17px',
              fontWeight: 800,
              color: themeStyles.textPrimary,
              letterSpacing: '-0.3px',
              lineHeight: 1.2
            }}
          >
            {getTitle()}
          </h1>
        </div>

        {/* Center: Global Search with Ctrl+K indicator */}
        <div style={{ width: '380px', maxWidth: '35%', position: 'relative' }}>
          <SearchBox
            placeholder="Search projects, tasks, or clients..."
            value={globalSearch}
            onChange={(_, val) => setGlobalSearch(val || '')}
            onClear={() => setGlobalSearch('')}
            underlined={false}
            styles={{
              root: {
                backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
                borderRadius: '10px',
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.textPrimary,
                height: '38px',
                transition: 'border-color 0.15s ease'
              },
              field: {
                color: themeStyles.textPrimary,
                fontSize: '13px'
              },
              icon: {
                color: themeStyles.textSecondary
              }
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              display: 'flex',
              gap: '2px'
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: themeStyles.textMuted,
                backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
            >
              Ctrl K
            </span>
          </div>
        </div>

        {/* Right: Actions, Theme Toggle, Notifications & Persona */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Quick Filter Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
              border: `1px solid ${themeStyles.border}`,
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: themeStyles.textSecondary
            }}
          >
            <i className="ms-Icon ms-Icon--DateTime" style={{ color: themeStyles.accentBlue, fontSize: '13px' }} />
            <span>Q1 2026 Fiscal</span>
          </div>

          {/* Theme Toggle */}
          <IconButton
            iconProps={{ iconName: currentTheme === 'dark' ? 'Sunny' : 'ClearNight' }}
            title={currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            ariaLabel="Toggle theme"
            onClick={toggleTheme}
            styles={{
              root: {
                color: themeStyles.textSecondary,
                borderRadius: '8px',
                ':hover': { color: themeStyles.textPrimary, backgroundColor: themeStyles.bgCardHover }
              }
            }}
          />

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <div ref={el => setNotificationButtonEl(el)}>
              <IconButton
                iconProps={{ iconName: 'Ringer' }}
                title="Notifications"
                ariaLabel="Notifications"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                styles={{
                  root: {
                    color: themeStyles.textSecondary,
                    borderRadius: '8px',
                    ':hover': { color: themeStyles.textPrimary, backgroundColor: themeStyles.bgCardHover }
                  }
                }}
              />
            </div>
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#f43f5e',
                  boxShadow: '0 0 6px #f43f5e',
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>

          {/* Notifications Dropdown Callout */}
          {isNotificationsOpen && notificationButtonEl && (
            <Callout
              target={notificationButtonEl}
              onDismiss={() => setIsNotificationsOpen(false)}
              directionalHint={DirectionalHint.bottomRightEdge}
              gapSpace={8}
              styles={{
                root: {
                  width: '320px',
                  backgroundColor: themeStyles.bgCardElevated,
                  border: `1px solid ${themeStyles.border}`,
                  borderRadius: '12px',
                  boxShadow: themeStyles.cardShadowHover,
                  padding: '16px',
                  zIndex: 100
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>
                  Notifications ({unreadNotificationCount})
                </h4>
                <span style={{ fontSize: '11px', color: themeStyles.accentBlue, cursor: 'pointer', fontWeight: 600 }}>
                  Mark all read
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.08)',
                      border: `1px solid ${n.isRead ? themeStyles.border : 'rgba(14, 165, 233, 0.2)'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: themeStyles.textPrimary }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                      {n.message}
                    </div>
                  </div>
                ))}
              </div>
            </Callout>
          )}

          {/* User Persona Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: `1px solid ${themeStyles.border}` }}>
            <Persona
              text={currentUser.title}
              secondaryText={currentUser.jobTitle || 'Executive'}
              size={PersonaSize.size32}
              hidePersonaDetails={false}
              styles={{
                primaryText: { color: themeStyles.textPrimary, fontWeight: 700, fontSize: '12.5px' },
                secondaryText: { color: themeStyles.textSecondary, fontSize: '11px' }
              }}
            />
          </div>
        </div>
      </header>

      {/* Toast Notification Stack */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '420px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto', boxShadow: themeStyles.cardShadowHover, borderRadius: '8px', overflow: 'hidden' }}>
            <MessageBar
              messageBarType={
                t.type === 'success'
                  ? MessageBarType.success
                  : t.type === 'error'
                  ? MessageBarType.error
                  : t.type === 'warning'
                  ? MessageBarType.warning
                  : MessageBarType.info
              }
              onDismiss={() => removeToast(t.id)}
              isMultiline={false}
            >
              {t.message}
            </MessageBar>
          </div>
        ))}
      </div>
    </>
  );
};
