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
      case 'tasks': return 'Enterprise Task Management';
      case 'kanban': return 'Interactive Kanban Workflow';
      case 'excel': return 'Excel Bulk Import & Validation';
      case 'documents': return 'Document Management Library';
      case 'approvals': return 'Workflow Approval Center';
      case 'team': return 'Team Allocation & Workload';
      case 'reports': return 'Reports & Executive Analytics';
      case 'settings': return 'Dynamic Schema Discovery & Configuration';
      default: return 'Enterprise Portal';
    }
  };

  return (
    <>
      <header
        style={{
          height: '64px',
          backgroundColor: themeStyles.bgHeader,
          borderBottom: `1px solid ${themeStyles.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
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
              fontSize: '18px',
              fontWeight: 700,
              color: themeStyles.textPrimary,
              letterSpacing: '-0.2px'
            }}
          >
            {getTitle()}
          </h1>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>
            Microsoft 365 SharePoint Online Enterprise Environment
          </div>
        </div>

        {/* Center: Global Search */}
        <div style={{ width: '320px', maxWidth: '35%' }}>
          <SearchBox
            placeholder="Search projects, tasks, or clients..."
            value={globalSearch}
            onChange={(_, val) => setGlobalSearch(val || '')}
            onClear={() => setGlobalSearch('')}
            underlined={false}
            styles={{
              root: {
                backgroundColor: currentTheme === 'dark' ? '#13213d' : '#f1f5f9',
                borderRadius: '8px',
                border: `1px solid ${themeStyles.border}`,
                color: themeStyles.textPrimary
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
                    ':hover': { color: themeStyles.accentBlue, backgroundColor: themeStyles.bgCardHover }
                  }
                }}
              />
            </div>
            {unreadNotificationCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: themeStyles.accentRed,
                  pointerEvents: 'none'
                }}
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
                  width: '320px',
                  padding: '16px',
                  backgroundColor: themeStyles.bgCard,
                  color: themeStyles.textPrimary,
                  border: `1px solid ${themeStyles.border}`,
                  borderRadius: '10px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  borderBottom: `1px solid ${themeStyles.border}`,
                  paddingBottom: '8px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px' }}>Notifications</div>
                <div style={{ fontSize: '11px', color: themeStyles.accentBlue }}>
                  {unreadNotificationCount} unread
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(0, 168, 232, 0.08)',
                      borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${themeStyles.accentBlue}`,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '12.5px', color: themeStyles.textPrimary }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
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

          {/* User Persona */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '8px',
              borderLeft: `1px solid ${themeStyles.border}`
            }}
          >
            <Persona
              text={currentUser.title}
              secondaryText={currentUser.email}
              size={PersonaSize.size32}
              hidePersonaDetails={false}
              styles={{
                primaryText: { color: themeStyles.textPrimary, fontSize: '13px', fontWeight: 600 },
                secondaryText: { color: themeStyles.textMuted, fontSize: '11px' }
              }}
            />
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
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                  borderRadius: '8px'
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
