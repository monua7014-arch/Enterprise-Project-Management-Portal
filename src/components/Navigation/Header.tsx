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
      case 'timeline': return 'Multi-project Gantt roadmap with milestone markers and dependencies';
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
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 9
        }}
      >
        {/* Left: View Title & Subtitle */}
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 800,
              color: themeStyles.textPrimary,
              letterSpacing: '-0.3px',
              lineHeight: 1.2
            }}
          >
            {getTitle()}
          </h1>
          <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            {getSubtitle()}
          </div>
        </div>

        {/* Center: Global Search with Ctrl+K indicator */}
        <div style={{ width: '340px', maxWidth: '35%', position: 'relative' }}>
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
                padding: '2px 5px',
                borderRadius: '4px'
              }}
            >
              Ctrl K
            </span>
          </div>
        </div>

        {/* Right: Actions, Theme Toggle, Notifications & Persona */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Theme Toggle */}
          <IconButton
            iconProps={{ iconName: currentTheme === 'dark' ? 'Sunny' : 'ClearNight' }}
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark Navy'} Mode`}
            ariaLabel="Toggle theme"
            onClick={toggleTheme}
            styles={{
              root: {
                color: themeStyles.textSecondary,
                borderRadius: '8px',
                ':hover': { color: themeStyles.accentBlue, backgroundColor: themeStyles.bgCardHover }
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
                    ':hover': { color: themeStyles.accentBlue, backgroundColor: themeStyles.bgCardHover }
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
                  backgroundColor: themeStyles.accentRed,
                  boxShadow: `0 0 8px ${themeStyles.accentRed}`,
                  pointerEvents: 'none'
                }}
                className="pulse-dot"
              />
            )}
          </div>

          {/* Notifications Callout */}
          {isNotificationsOpen && notificationButtonEl && (
            <Callout
              target={notificationButtonEl}
              onDismiss={() => setIsNotificationsOpen(false)}
              directionalHint={DirectionalHint.bottomRightEdge}
              styles={{
                calloutMain: {
                  width: '340px',
                  padding: '18px',
                  backgroundColor: themeStyles.bgCard,
                  color: themeStyles.textPrimary,
                  border: `1px solid ${themeStyles.border}`,
                  borderRadius: '12px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(20px)'
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '14px',
                  borderBottom: `1px solid ${themeStyles.border}`,
                  paddingBottom: '10px'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.2px' }}>
                  System Notifications
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: themeStyles.accentBlue,
                    backgroundColor: 'rgba(14, 165, 233, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: 700
                  }}
                >
                  {unreadNotificationCount} unread
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(14, 165, 233, 0.08)',
                      borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${themeStyles.accentBlue}`,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13px', color: themeStyles.textPrimary }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '12px', color: themeStyles.textSecondary, marginTop: '2px', lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '10px', color: themeStyles.textMuted, marginTop: '4px' }}>
                      {new Date(n.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </Callout>
          )}

          {/* User Persona with online indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '12px',
              borderLeft: `1px solid ${themeStyles.border}`
            }}
          >
            <div style={{ position: 'relative' }}>
              <Persona
                text={currentUser.title}
                secondaryText={currentUser.jobTitle || currentUser.email}
                size={PersonaSize.size32}
                hidePersonaDetails={false}
                styles={{
                  primaryText: { color: themeStyles.textPrimary, fontSize: '13px', fontWeight: 700 },
                  secondaryText: { color: themeStyles.textMuted, fontSize: '11px' }
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '1px',
                  left: '24px',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: themeStyles.accentGreen,
                  border: `2px solid ${themeStyles.bgHeader}`,
                  boxShadow: `0 0 6px ${themeStyles.accentGreen}`
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Floating Toast Alerts */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '380px'
        }}
      >
        {toasts.map(toast => {
          let mbType = MessageBarType.success;
          if (toast.type === 'error') mbType = MessageBarType.error;
          else if (toast.type === 'warning') mbType = MessageBarType.warning;
          else if (toast.type === 'info') mbType = MessageBarType.info;

          return (
            <MessageBar
              key={toast.id}
              messageBarType={mbType}
              onDismiss={() => removeToast(toast.id)}
              dismissButtonAriaLabel="Close"
              styles={{
                root: {
                  boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                  borderRadius: '10px',
                  border: `1px solid ${themeStyles.border}`
                }
              }}
            >
              {toast.message}
            </MessageBar>
          );
        })}
      </div>
    </>
  );
};
