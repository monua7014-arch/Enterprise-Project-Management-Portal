import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ProjectService, 
  TaskService, 
  ApprovalService, 
  ReportingService 
} from '../../services';
import { 
  IProjectItem, 
  ITaskItem, 
  IApprovalItem, 
  IDashboardMetrics,
  IActivityLogItem
} from '../../models';
import { 
  Spinner, 
  SpinnerSize, 
  PrimaryButton, 
  DefaultButton, 
  ProgressIndicator 
} from '@fluentui/react';

export const ExecutiveDashboard: React.FC = () => {
  const { config, themeStyles, setActiveView, setSelectedProjectId, refreshTrigger, currentTheme } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<IDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [approvals, setApprovals] = useState<IApprovalItem[]>([]);
  const [activities, setActivities] = useState<IActivityLogItem[]>([]);

  const isDark = currentTheme === 'dark';

  useEffect(() => {
    loadDashboardData();
  }, [config, refreshTrigger]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const projectService = ProjectService.getInstance();
      const taskService = TaskService.getInstance();
      const approvalService = ApprovalService.getInstance();
      const reportingService = ReportingService.getInstance();

      const [pList, tList, aList] = await Promise.all([
        projectService.getProjects(config),
        taskService.getTasks(config),
        approvalService.getApprovals(config)
      ]);

      const pendingApprovalsCount = aList.filter(a => a.status === 'Pending').length;
      const calculatedMetrics = reportingService.calculateMetrics(pList, tList, pendingApprovalsCount);

      setProjects(pList);
      setTasks(tList);
      setApprovals(aList);
      setMetrics(calculatedMetrics);
      setActivities(projectService.getActivities().slice(0, 5));
    } catch (err) {
      console.error('[ExecutiveDashboard] Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spinner size={SpinnerSize.large} label="Loading executive project intelligence from SharePoint..." />
      </div>
    );
  }

  if (!metrics) return null;

  // Status distribution calculations
  const statuses = ['Active', 'Completed', 'Delayed', 'Planning', 'On Hold'];
  const statusColors: { [key: string]: string } = {
    Active: '#10b981',
    Completed: '#0ea5e9',
    Delayed: '#f43f5e',
    Planning: '#f59e0b',
    'On Hold': '#8b5cf6'
  };

  const statusCounts = statuses.map(s => ({
    status: s,
    count: projects.filter(p => p.status === s).length,
    color: statusColors[s] || '#64748b'
  }));

  // Task priority counts
  const priorities = ['Critical', 'High', 'Medium', 'Low'];
  const priorityColors: { [key: string]: string } = {
    Critical: '#f43f5e',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#10b981'
  };

  const priorityCounts = priorities.map(p => ({
    priority: p,
    count: tasks.filter(t => t.priority === p).length,
    color: priorityColors[p]
  }));

  // Upcoming deadlines
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const kpiCards = [
    { title: 'Total Projects', value: metrics.totalProjects, icon: 'ProjectDocument', color: '#0ea5e9', trend: '+14%', trendUp: true, subtitle: 'Across all business units' },
    { title: 'Active Delivery', value: metrics.activeProjects, icon: 'SyncStatus', color: '#10b981', trend: 'Active', trendUp: true, subtitle: 'In flight sprints' },
    { title: 'Completed', value: metrics.completedProjects, icon: 'CompletedSolid', color: '#38bdf8', trend: '100% SLA', trendUp: true, subtitle: 'Delivered sign-offs' },
    { title: 'Delayed / Attention', value: metrics.delayedProjects, icon: 'Warning12', color: '#f43f5e', trend: 'Requires triage', trendUp: false, subtitle: 'Action required' },
    { title: 'Total Work Items', value: metrics.totalTasks, icon: 'TaskGroup', color: '#818cf8', trend: '+8 new', trendUp: true, subtitle: 'Sprint deliverables' },
    { title: 'Pending Tasks', value: metrics.pendingTasks, icon: 'Clock', color: '#f59e0b', trend: 'In progress', trendUp: true, subtitle: 'Assigned to team' },
    { title: 'Overdue Risk Items', value: metrics.overdueTasks, icon: 'ErrorBadge', color: '#f43f5e', trend: 'Action needed', trendUp: false, subtitle: 'Passed target date' },
    { title: 'Pending Approvals', value: metrics.pendingApprovals, icon: 'CheckList', color: '#a855f7', trend: 'Awaiting PMO', trendUp: false, subtitle: 'Governance gates' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '36px' }}>
      {/* Top Hero Banner with Gradient & Ambient Lighting */}
      <div
        style={{
          position: 'relative',
          padding: '28px 32px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: themeStyles.cardShadow,
          background: isDark
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(99, 102, 241, 0.04) 50%, rgba(12, 19, 34, 0.95) 100%)'
            : '#ffffff'
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        {isDark && (
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.6px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(14, 165, 233, 0.15)',
                  color: themeStyles.accentBlue,
                  textTransform: 'uppercase'
                }}
              >
                Executive Command Center
              </span>
              <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>•</span>
              <span style={{ fontSize: '12px', color: themeStyles.accentGreen, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: themeStyles.accentGreen }} className="pulse-dot" />
                Live SharePoint Telemetry
              </span>
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '22px',
                fontWeight: 800,
                color: themeStyles.textPrimary,
                letterSpacing: '-0.4px'
              }}
            >
              Enterprise Portfolio & Delivery Health
            </h2>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '12px', fontSize: '13px' }}>
              <div style={{ color: themeStyles.textSecondary }}>
                Total Allocated Capital: <strong style={{ color: themeStyles.textPrimary, fontWeight: 700 }}>${metrics.totalBudget.toLocaleString()}</strong>
              </div>
              <div style={{ color: themeStyles.textMuted }}>|</div>
              <div style={{ color: themeStyles.textSecondary }}>
                Average Milestone Progress: <strong style={{ color: themeStyles.accentBlue, fontWeight: 700 }}>{metrics.averageProgress}%</strong>
              </div>
              <div style={{ color: themeStyles.textMuted }}>|</div>
              <div style={{ color: themeStyles.textSecondary }}>
                Governance Health: <strong style={{ color: themeStyles.accentGreen, fontWeight: 700 }}>Optimal (92/100)</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <DefaultButton
              text="Interactive Gantt"
              iconProps={{ iconName: 'Timeline' }}
              onClick={() => setActiveView('timeline')}
              styles={{
                root: {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  borderColor: themeStyles.border,
                  color: themeStyles.textPrimary,
                  borderRadius: '10px',
                  height: '38px',
                  fontWeight: 600
                }
              }}
            />
            <DefaultButton
              text="Kanban Board"
              iconProps={{ iconName: 'Tiles' }}
              onClick={() => setActiveView('kanban')}
              styles={{
                root: {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  borderColor: themeStyles.border,
                  color: themeStyles.textPrimary,
                  borderRadius: '10px',
                  height: '38px',
                  fontWeight: 600
                }
              }}
            />
            <PrimaryButton
              text="New Project"
              iconProps={{ iconName: 'Add' }}
              onClick={() => setActiveView('projects')}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  height: '38px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards Grid with Modern Micro-Trends */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px'
        }}
      >
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              padding: '20px 22px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '14px',
              boxShadow: themeStyles.cardShadow,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = themeStyles.borderGlow;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = themeStyles.border;
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: themeStyles.textSecondary, fontWeight: 600, letterSpacing: '0.2px' }}>
                  {kpi.title}
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: themeStyles.textPrimary,
                    marginTop: '6px',
                    letterSpacing: '-0.8px',
                    lineHeight: 1
                  }}
                >
                  {kpi.value}
                </div>
              </div>

              {/* Glowing Icon Container */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: `${kpi.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: kpi.color,
                  fontSize: '19px',
                  boxShadow: `0 4px 12px ${kpi.color}22`,
                  border: `1px solid ${kpi.color}33`
                }}
              >
                <i className={`ms-Icon ms-Icon--${kpi.icon}`} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '10px', borderTop: `1px solid ${themeStyles.borderLight}` }}>
              <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>
                {kpi.subtitle}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: kpi.trendUp ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)',
                  color: kpi.trendUp ? themeStyles.accentGreen : themeStyles.accentRed
                }}
              >
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Breakdown Row: Status Distribution & Task Priorities */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Project Status Distribution */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '14px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: themeStyles.textPrimary }}>
                Project Status Distribution
              </h3>
              <div style={{ fontSize: '11.5px', color: themeStyles.textMuted, marginTop: '2px' }}>
                Delivery progress across operational lifecycles
              </div>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: themeStyles.accentBlue,
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                padding: '3px 9px',
                borderRadius: '6px'
              }}
            >
              {projects.length} Total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {statusCounts.map(item => {
              const pct = projects.length > 0 ? Math.round((item.count / projects.length) * 100) : 0;
              return (
                <div key={item.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: themeStyles.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                      {item.status}
                    </span>
                    <span style={{ color: themeStyles.textSecondary, fontWeight: 700 }}>
                      {item.count} <span style={{ color: themeStyles.textMuted, fontWeight: 500 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: item.color,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Priority Breakdown */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '14px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: themeStyles.textPrimary }}>
                Work Item Priority Breakdown
              </h3>
              <div style={{ fontSize: '11.5px', color: themeStyles.textMuted, marginTop: '2px' }}>
                Resource focus by criticality tier
              </div>
            </div>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: themeStyles.accentBlue,
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                padding: '3px 9px',
                borderRadius: '6px'
              }}
            >
              {tasks.length} Tasks
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {priorityCounts.map(item => {
              const pct = tasks.length > 0 ? Math.round((item.count / tasks.length) * 100) : 0;
              return (
                <div key={item.priority}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: themeStyles.textPrimary, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                      {item.priority}
                    </span>
                    <span style={{ color: themeStyles.textSecondary, fontWeight: 700 }}>
                      {item.count} <span style={{ color: themeStyles.textMuted, fontWeight: 500 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: item.color,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Projects & Upcoming Deadlines */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Recent Projects Portfolio */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '14px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: themeStyles.textPrimary }}>
              Active Projects Portfolio
            </h3>
            <button
              onClick={() => setActiveView('projects')}
              style={{
                background: 'none',
                border: 'none',
                color: themeStyles.accentBlue,
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              View Full Portfolio &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {projects.slice(0, 4).map(p => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setActiveView('project-detail');
                }}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  backgroundColor: themeStyles.bgCardHover,
                  border: `1px solid ${themeStyles.borderLight}`,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = themeStyles.borderGlow;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = themeStyles.borderLight;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(14, 165, 233, 0.15)',
                        color: themeStyles.accentBlue
                      }}
                    >
                      {p.projectId}
                    </span>
                    <span
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: themeStyles.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {p.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: themeStyles.textMuted, marginTop: '4px' }}>
                    Client: <strong style={{ color: themeStyles.textSecondary }}>{p.clientName}</strong> &nbsp;•&nbsp;
                    Budget: <strong style={{ color: themeStyles.textPrimary }}>${p.budget.toLocaleString()}</strong>
                  </div>
                </div>

                <div style={{ width: '90px', textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: themeStyles.textPrimary, marginBottom: '4px' }}>
                    {p.progress}%
                  </div>
                  <ProgressIndicator
                    percentComplete={p.progress / 100}
                    styles={{
                      progressBar: { background: 'linear-gradient(90deg, #0ea5e9, #6366f1)' }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines & Activity Feed */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '14px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: themeStyles.textPrimary }}>
              Upcoming Milestones & Deadlines
            </h3>
            <button
              onClick={() => setActiveView('tasks')}
              style={{
                background: 'none',
                border: 'none',
                color: themeStyles.accentBlue,
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Task Center &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingTasks.map(t => {
              const isOverdue = new Date(t.dueDate).getTime() < Date.now();
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: themeStyles.bgCardHover,
                    border: `1px solid ${themeStyles.borderLight}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: themeStyles.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '2px' }}>
                      Assignee: {t.assignedTo?.title || 'Unassigned'} • Priority: {t.priority}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: isOverdue ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isOverdue ? themeStyles.accentRed : themeStyles.accentGreen,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Activity Logs Stream */}
          <div style={{ marginTop: '20px', borderTop: `1px solid ${themeStyles.border}`, paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12.5px', fontWeight: 700, color: themeStyles.textMuted, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Real-Time SharePoint Activity Stream
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.slice(0, 3).map(a => (
                <div key={a.id} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ms-Icon ms-Icon--ActivityFeed" style={{ color: themeStyles.accentBlue, fontSize: '14px' }} />
                  <span style={{ color: themeStyles.textPrimary, fontWeight: 700 }}>{a.action}:</span>
                  <span style={{ color: themeStyles.textSecondary }}>{a.details}</span>
                  <span style={{ color: themeStyles.textMuted, fontSize: '10px', marginLeft: 'auto' }}>
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
