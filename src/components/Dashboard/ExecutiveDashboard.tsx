import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
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
  IActivityLogItem,
  IRiskItem
} from '../../models';
import { INITIAL_RISKS } from '../../services/MockData';
import { getStatusBadgeStyle } from '../../styles/theme';
import { 
  Spinner, 
  SpinnerSize, 
  PrimaryButton, 
  DefaultButton, 
  ProgressIndicator,
  Dropdown,
  IDropdownOption
} from '@fluentui/react';

export const ExecutiveDashboard: React.FC = () => {
  const { 
    config, 
    themeStyles, 
    setActiveView, 
    setSelectedProjectId, 
    refreshTrigger, 
    currentTheme,
    setPortfolioFilter
  } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<IDashboardMetrics | null>(null);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [approvals, setApprovals] = useState<IApprovalItem[]>([]);
  const [activities, setActivities] = useState<IActivityLogItem[]>([]);
  const [risks] = useState<IRiskItem[]>(INITIAL_RISKS);
  const [timeRange, setTimeRange] = useState<string>('Q1');

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
      setActivities(projectService.getActivities().slice(0, 6));
    } catch (err) {
      console.error('[ExecutiveDashboard] Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Navigates to Projects Portfolio with applied status filter
  const handleKpiClick = (filterStatus?: string) => {
    if (filterStatus) {
      setPortfolioFilter({ status: filterStatus });
    } else {
      setPortfolioFilter(null);
    }
    setActiveView('projects');
  };

  // Derived calculations
  const totalBudget = useMemo(() => projects.reduce((acc, p) => acc + p.budget, 0), [projects]);
  const totalSpent = useMemo(() => projects.reduce((acc, p) => acc + (p.actualSpend || (p.budget * (p.progress / 100) * 0.9)), 0), [projects]);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const overdueTasks = useMemo(() => {
    const now = new Date().getTime();
    return tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < now);
  }, [tasks]);

  const upcomingMilestones = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 4);
  }, [tasks]);

  const criticalRisks = useMemo(() => {
    return risks.filter(r => r.score >= 12);
  }, [risks]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '450px' }}>
        <Spinner size={SpinnerSize.large} label="Analyzing executive project telemetry and portfolio signals..." />
      </div>
    );
  }

  if (!metrics) return null;

  const kpiCards = [
    { 
      title: 'TOTAL PROJECTS', 
      value: metrics.totalProjects, 
      icon: 'ProjectDocument', 
      color: '#0ea5e9', 
      trend: '+12% YoY', 
      trendUp: true, 
      filter: undefined,
      description: 'Active enterprise portfolio' 
    },
    { 
      title: 'ACTIVE DELIVERY', 
      value: metrics.activeProjects, 
      icon: 'SyncStatus', 
      color: '#10b981', 
      trend: 'On Track', 
      trendUp: true, 
      filter: 'Active',
      description: 'In-flight execution sprints' 
    },
    { 
      title: 'DELAYED / ATTENTION', 
      value: metrics.delayedProjects, 
      icon: 'Warning12', 
      color: '#f43f5e', 
      trend: `${metrics.delayedProjects} Needs Action`, 
      trendUp: false, 
      filter: 'Delayed',
      description: 'Variance exceeding 10%' 
    },
    { 
      title: 'PORTFOLIO BUDGET', 
      value: `$${(totalBudget / 1000).toFixed(0)}k`, 
      icon: 'Money', 
      color: '#a855f7', 
      trend: `${budgetUtilization}% Burn`, 
      trendUp: budgetUtilization <= 90, 
      filter: undefined,
      description: `$${(totalSpent / 1000).toFixed(0)}k utilized` 
    },
    { 
      title: 'OVERDUE TASKS', 
      value: overdueTasks.length, 
      icon: 'Clock', 
      color: '#f59e0b', 
      trend: overdueTasks.length === 0 ? 'Zero Overdue' : 'SLA Breaches', 
      trendUp: overdueTasks.length === 0, 
      filter: undefined,
      description: 'Immediate mitigation' 
    }
  ];

  const timeRangeOptions: IDropdownOption[] = [
    { key: 'Q1', text: 'Q1 2026 Fiscal' },
    { key: 'Q2', text: 'Q2 2026 Fiscal' },
    { key: 'H1', text: 'H1 2026 (First Half)' },
    { key: 'FY2026', text: 'Full Year 2026' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '32px' }}>
      {/* Top Welcome & Telemetry Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '22px 28px',
          borderRadius: '14px',
          background: isDark
            ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(12, 19, 34, 0.95) 100%)'
            : 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 100%)',
          border: `1px solid ${themeStyles.borderGlow}`,
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 10px #10b981'
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.accentBlue, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
              Executive Portfolio Command Center
            </span>
          </div>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: 800, color: themeStyles.textPrimary, letterSpacing: '-0.4px' }}>
            Enterprise Delivery Intelligence & Health
          </h2>
          <div style={{ fontSize: '12.5px', color: themeStyles.textSecondary, marginTop: '3px' }}>
            Aggregated telemetry across {metrics.totalProjects} active client initiatives and {tasks.length} delivery tasks.
          </div>
        </div>

        {/* Date Filter & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '170px' }}>
            <Dropdown
              selectedKey={timeRange}
              options={timeRangeOptions}
              onChange={(_, opt) => opt && setTimeRange(opt.key as string)}
              styles={{
                title: {
                  backgroundColor: themeStyles.bgCard,
                  borderColor: themeStyles.border,
                  color: themeStyles.textPrimary,
                  borderRadius: '8px',
                  height: '36px',
                  lineHeight: '34px',
                  fontSize: '12px'
                }
              }}
            />
          </div>
          <PrimaryButton
            text="AI Copilot"
            iconProps={{ iconName: 'Sparkle' }}
            onClick={() => setActiveView('copilot')}
            styles={{
              root: {
                borderRadius: '8px',
                height: '36px',
                backgroundColor: themeStyles.accentBlue,
                border: 'none',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
              }
            }}
          />
        </div>
      </div>

      {/* Interactive KPI Cards (Click to Navigate & Filter) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}
      >
        {kpiCards.map((kpi, idx) => (
          <div
            key={idx}
            onClick={() => handleKpiClick(kpi.filter)}
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: themeStyles.cardShadow
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = kpi.color;
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = themeStyles.cardShadowHover;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = themeStyles.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = themeStyles.cardShadow;
            }}
          >
            {/* Top Glowing Neon Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: `linear-gradient(90deg, ${kpi.color} 0%, transparent 100%)`
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, letterSpacing: '0.4px' }}>
                {kpi.title}
              </span>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: `${kpi.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: kpi.color
                }}
              >
                <i className={`ms-Icon ms-Icon--${kpi.icon}`} style={{ fontSize: '16px' }} />
              </div>
            </div>

            <div style={{ margin: '14px 0 6px 0', fontSize: '28px', fontWeight: 800, color: themeStyles.textPrimary, letterSpacing: '-0.5px' }}>
              {kpi.value}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>
                {kpi.description}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: kpi.trendUp ? '#10b981' : '#f43f5e',
                  backgroundColor: kpi.trendUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  padding: '2px 7px',
                  borderRadius: '10px'
                }}
              >
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Analytical Visualizations Grid: Health Distribution & Budget Burn Trend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Project Health & Status Breakdown */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
                Portfolio Health Breakdown
              </h3>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                Operational status across all initiatives
              </div>
            </div>
            <span
              onClick={() => setActiveView('projects')}
              style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 600, cursor: 'pointer' }}
            >
              View Portfolio →
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {['Active', 'Planning', 'Delayed', 'Completed'].map(status => {
              const count = projects.filter(p => p.status === status).length;
              const pct = projects.length > 0 ? Math.round((count / projects.length) * 100) : 0;
              let barColor = '#0ea5e9';
              if (status === 'Active') barColor = '#10b981';
              if (status === 'Delayed') barColor = '#f43f5e';
              if (status === 'Planning') barColor = '#f59e0b';

              return (
                <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: barColor }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: themeStyles.textPrimary }}>
                        {status} Projects
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: themeStyles.textSecondary }}>
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', borderRadius: '4px', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        backgroundColor: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Average Health Score Bar */}
          <div
            style={{
              marginTop: '20px',
              padding: '14px',
              borderRadius: '8px',
              backgroundColor: isDark ? 'rgba(14, 165, 233, 0.05)' : '#f0f9ff',
              border: `1px solid ${isDark ? 'rgba(14, 165, 233, 0.15)' : '#bae6fd'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary }}>Portfolio Health Score</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: themeStyles.accentBlue }}>86.4 / 100</div>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '4px 8px', borderRadius: '6px' }}>
              EXCELLENT
            </div>
          </div>
        </div>

        {/* Budget Utilization & Financial Burn Wave (Interactive SVG Chart) */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
                Financial Trajectory & Burn Rate
              </h3>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                Planned Value (PV) vs. Actual Cost (AC) telemetry
              </div>
            </div>
            <span
              onClick={() => setActiveView('financials')}
              style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 600, cursor: 'pointer' }}
            >
              Open EVM →
            </span>
          </div>

          {/* Realistic SVG Curved Trajectory Chart */}
          <div style={{ width: '100%', height: '140px', position: 'relative' }}>
            <svg viewBox="0 0 500 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="35" x2="500" y2="35" stroke={isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="500" y2="75" stroke={isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} strokeDasharray="3 3" />
              <line x1="0" y1="115" x2="500" y2="115" stroke={isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9"} strokeDasharray="3 3" />

              {/* Planned Value Curve & Fill */}
              <path
                d="M 0 120 C 100 110, 200 80, 300 55 C 400 35, 450 25, 500 18 L 500 140 L 0 140 Z"
                fill="url(#areaGradient)"
              />
              <path
                d="M 0 120 C 100 110, 200 80, 300 55 C 400 35, 450 25, 500 18"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
              />

              {/* Actual Cost Curve */}
              <path
                d="M 0 125 C 100 115, 200 88, 300 68 C 400 52, 450 48, 500 42"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${themeStyles.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#0ea5e9' }} />
              <span style={{ fontSize: '11px', color: themeStyles.textSecondary }}>Planned Value (PV)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#a855f7' }} />
              <span style={{ fontSize: '11px', color: themeStyles.textSecondary }}>Actual Cost (AC)</span>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>
              CPI: 1.08 (Under Budget)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Operational Triage: Critical Risks, Upcoming Milestones, & Recent Activities */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Critical Risk Triage */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
                High-Impact Risk Register
              </h3>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                Score ≥ 12 requiring executive escalation
              </div>
            </div>
            <span
              onClick={() => setActiveView('risks')}
              style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 600, cursor: 'pointer' }}
            >
              5x5 Matrix →
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {criticalRisks.slice(0, 3).map(r => (
              <div
                key={r.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(244, 63, 94, 0.06)' : '#fff1f2',
                  border: `1px solid ${isDark ? 'rgba(244, 63, 94, 0.2)' : '#fecdd3'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: themeStyles.textPrimary }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                    Owner: {r.owner} • {r.category}
                  </div>
                </div>
                <div
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#f43f5e',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  Score {r.score}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Milestones */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
                Upcoming Milestone Deliverables
              </h3>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                Next deliverables due within 30 days
              </div>
            </div>
            <span
              onClick={() => setActiveView('timeline')}
              style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 600, cursor: 'pointer' }}
            >
              Gantt View →
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {upcomingMilestones.map(t => (
              <div
                key={t.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: `1px solid ${themeStyles.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: themeStyles.textPrimary, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: '10.5px', color: themeStyles.textSecondary }}>
                    Due: {new Date(t.dueDate).toLocaleDateString()} • {t.projectTitle || 'Core Project'}
                  </div>
                </div>
                <div style={getStatusBadgeStyle(t.status, isDark)}>
                  {t.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Stream */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
                Audit Log & Activity Telemetry
              </h3>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                Immutable event stream from SharePoint
              </div>
            </div>
            <i className="ms-Icon ms-Icon--Rerun" style={{ color: themeStyles.textSecondary, fontSize: '14px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activities.map(act => (
              <div key={act.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: themeStyles.accentBlue,
                    marginTop: '6px',
                    flexShrink: 0
                  }}
                />
                <div style={{ fontSize: '11.5px', lineHeight: 1.4 }}>
                  <span style={{ fontWeight: 700, color: themeStyles.textPrimary }}>{act.performedBy}</span>{' '}
                  <span style={{ color: themeStyles.textSecondary }}>{act.action}</span>
                  <div style={{ fontSize: '10px', color: themeStyles.textMuted, marginTop: '1px' }}>
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
