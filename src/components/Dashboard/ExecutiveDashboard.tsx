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
  const { config, themeStyles, setActiveView, setSelectedProjectId, refreshTrigger } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<IDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [approvals, setApprovals] = useState<IApprovalItem[]>([]);
  const [activities, setActivities] = useState<IActivityLogItem[]>([]);

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
    Completed: '#00a8e8',
    Delayed: '#ef4444',
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
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#10b981'
  };

  const priorityCounts = priorities.map(p => ({
    priority: p,
    count: tasks.filter(t => t.priority === p).length,
    color: priorityColors[p]
  }));

  // Upcoming deadlines (tasks due in future, sorted soonest)
  const upcomingTasks = [...tasks]
    .filter(t => t.status !== 'Completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const kpiCards = [
    { title: 'Total Projects', value: metrics.totalProjects, icon: 'ProjectDocument', color: themeStyles.accentBlue, subtitle: 'Across all business units' },
    { title: 'Active Projects', value: metrics.activeProjects, icon: 'SyncStatus', color: themeStyles.accentGreen, subtitle: 'In active delivery' },
    { title: 'Completed Projects', value: metrics.completedProjects, icon: 'CompletedSolid', color: '#38bdf8', subtitle: 'Successfully delivered' },
    { title: 'Delayed Projects', value: metrics.delayedProjects, icon: 'Warning12', color: themeStyles.accentRed, subtitle: 'Requires attention' },
    { title: 'Total Tasks', value: metrics.totalTasks, icon: 'TaskGroup', color: '#818cf8', subtitle: 'Across all work streams' },
    { title: 'Pending Tasks', value: metrics.pendingTasks, icon: 'Clock', color: themeStyles.accentAmber, subtitle: 'In flight or backlog' },
    { title: 'Overdue Tasks', value: metrics.overdueTasks, icon: 'ErrorBadge', color: '#f43f5e', subtitle: 'Past scheduled target' },
    { title: 'Pending Approvals', value: metrics.pendingApprovals, icon: 'CheckList', color: themeStyles.accentPurple, subtitle: 'Awaiting executive review' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      {/* Top Banner with Quick Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Portfolio Summary & Performance Metrics
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Total Allocated Budget: <strong style={{ color: themeStyles.textPrimary }}>${metrics.totalBudget.toLocaleString()}</strong> &nbsp;|&nbsp;
            Average Delivery Progress: <strong style={{ color: themeStyles.accentBlue }}>{metrics.averageProgress}%</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Create Task"
            iconProps={{ iconName: 'Add' }}
            onClick={() => setActiveView('tasks')}
            styles={{
              root: {
                backgroundColor: 'transparent',
                borderColor: themeStyles.border,
                color: themeStyles.textPrimary,
                borderRadius: '8px'
              }
            }}
          />
          <PrimaryButton
            text="New Project"
            iconProps={{ iconName: 'Add' }}
            onClick={() => setActiveView('projects')}
            styles={{
              root: {
                backgroundColor: themeStyles.accentBlue,
                borderColor: themeStyles.accentBlue,
                borderRadius: '8px'
              }
            }}
          />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            style={{
              padding: '18px 20px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '12px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'transform 0.15s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12.5px', color: themeStyles.textSecondary, fontWeight: 500 }}>
                  {kpi.title}
                </div>
                <div
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: themeStyles.textPrimary,
                    marginTop: '6px',
                    letterSpacing: '-0.5px'
                  }}
                >
                  {kpi.value}
                </div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: `${kpi.color}1a`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: kpi.color,
                  fontSize: '18px'
                }}
              >
                <i className={`ms-Icon ms-Icon--${kpi.icon}`} />
              </div>
            </div>

            <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '12px' }}>
              {kpi.subtitle}
            </div>

            {/* Bottom accent stripe */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '3px',
                backgroundColor: kpi.color
              }}
            />
          </div>
        ))}
      </div>

      {/* Charts & Analytical Breakdown Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Project Status Distribution */}
        <div
          style={{
            padding: '20px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Project Status Distribution
            </h3>
            <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>Total: {projects.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {statusCounts.map(item => {
              const pct = projects.length > 0 ? Math.round((item.count / projects.length) * 100) : 0;
              return (
                <div key={item.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ color: themeStyles.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                      {item.status}
                    </span>
                    <span style={{ color: themeStyles.textSecondary, fontWeight: 600 }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: item.color,
                        borderRadius: '4px',
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
            padding: '20px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Task Priority Breakdown
            </h3>
            <span style={{ fontSize: '12px', color: themeStyles.textMuted }}>Total: {tasks.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {priorityCounts.map(item => {
              const pct = tasks.length > 0 ? Math.round((item.count / tasks.length) * 100) : 0;
              return (
                <div key={item.priority}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ color: themeStyles.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                      {item.priority}
                    </span>
                    <span style={{ color: themeStyles.textSecondary, fontWeight: 600 }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: item.color,
                        borderRadius: '4px',
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
        {/* Recent Projects Table */}
        <div
          style={{
            padding: '20px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Recent Projects Portfolio
            </h3>
            <button
              onClick={() => setActiveView('projects')}
              style={{
                background: 'none',
                border: 'none',
                color: themeStyles.accentBlue,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View All &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.slice(0, 4).map(p => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProjectId(p.id);
                  setActiveView('project-detail');
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: themeStyles.bgCardHover,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.15s ease'
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 700 }}>
                      {p.projectId}
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: themeStyles.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {p.title}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '2px' }}>
                    Client: {p.clientName} &nbsp;|&nbsp; Budget: ${p.budget.toLocaleString()}
                  </div>
                </div>

                <div style={{ width: '90px', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginBottom: '4px' }}>
                    {p.progress}%
                  </div>
                  <ProgressIndicator
                    percentComplete={p.progress / 100}
                    styles={{
                      progressBar: { backgroundColor: themeStyles.accentBlue }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines & Recent Activities */}
        <div
          style={{
            padding: '20px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Upcoming Milestones & Deadlines
            </h3>
            <button
              onClick={() => setActiveView('tasks')}
              style={{
                background: 'none',
                border: 'none',
                color: themeStyles.accentBlue,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View Tasks &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingTasks.map(t => {
              const isOverdue = new Date(t.dueDate).getTime() < Date.now();
              return (
                <div
                  key={t.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: themeStyles.bgCardHover,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: themeStyles.textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '2px' }}>
                      Assigned: {t.assignedTo?.title || 'Unassigned'} &nbsp;|&nbsp; Priority: {t.priority}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
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

          {/* Activity Feed */}
          <div style={{ marginTop: '20px', borderTop: `1px solid ${themeStyles.border}`, paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 600, color: themeStyles.textPrimary }}>
              Recent SharePoint Activity Logs
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.slice(0, 3).map(a => (
                <div key={a.id} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ms-Icon ms-Icon--ActivityFeed" style={{ color: themeStyles.accentBlue, fontSize: '14px' }} />
                  <span style={{ color: themeStyles.textPrimary, fontWeight: 500 }}>{a.action}:</span>
                  <span style={{ color: themeStyles.textSecondary }}>{a.details}</span>
                  <span style={{ color: themeStyles.textMuted, fontSize: '10.5px', marginLeft: 'auto' }}>
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
