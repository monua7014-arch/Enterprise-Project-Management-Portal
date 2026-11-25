import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService, TaskService } from '../../services';
import { IProjectItem, ITaskItem, IMilestoneItem } from '../../models';
import { 
  Dropdown, 
  IDropdownOption, 
  DefaultButton, 
  IconButton, 
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

type Timescale = 'Quarterly' | 'Monthly' | 'Weekly';

export const GanttTimeline: React.FC = () => {
  const { config, themeStyles, refreshTrigger, setSelectedProjectId, setActiveView } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [milestones, setMilestones] = useState<IMilestoneItem[]>([]);
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('All');
  const [timescale, setTimescale] = useState<Timescale>('Monthly');

  useEffect(() => {
    loadData();
  }, [config, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pList = await ProjectService.getInstance().getProjects(config);
      const tList = await TaskService.getInstance().getTasks(config);
      
      let allMilestones: IMilestoneItem[] = [];
      for (const p of pList) {
        const m = await ProjectService.getInstance().getMilestones(p.id, config);
        allMilestones = allMilestones.concat(m);
      }

      setProjects(pList);
      setTasks(tList);
      setMilestones(allMilestones);
    } catch (err) {
      console.error('[GanttTimeline] Error loading timeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timeline Date Range: Jan 2026 to Dec 2026
  const timelineStart = new Date('2026-01-01T00:00:00Z').getTime();
  const timelineEnd = new Date('2026-12-31T23:59:59Z').getTime();
  const totalDuration = timelineEnd - timelineStart;

  const months = [
    'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026',
    'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'
  ];

  const filteredProjects = useMemo(() => {
    if (selectedProjectIdFilter === 'All') return projects;
    return projects.filter(p => String(p.id) === selectedProjectIdFilter);
  }, [projects, selectedProjectIdFilter]);

  const getPositionPercent = (dateStr: string) => {
    const time = new Date(dateStr).getTime();
    const clamped = Math.max(timelineStart, Math.min(timelineEnd, time));
    return ((clamped - timelineStart) / totalDuration) * 100;
  };

  const getBarMetrics = (startDate: string, endDate: string) => {
    const left = getPositionPercent(startDate);
    const right = getPositionPercent(endDate);
    const width = Math.max(right - left, 1.5);
    return { left: `${left}%`, width: `${width}%` };
  };

  // Current day position marker
  const todayLeft = `${getPositionPercent(new Date().toISOString())}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '20px 24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Enterprise Interactive Gantt Schedule & Delivery Roadmap
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Multi-year milestone schedule with critical path indicators, delivery progress fills, and timeline dependencies.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '200px' }}>
            <Dropdown
              selectedKey={selectedProjectIdFilter}
              options={[
                { key: 'All', text: 'All Enterprise Projects' },
                ...projects.map(p => ({ key: String(p.id), text: p.title }))
              ]}
              onChange={(_, opt) => opt && setSelectedProjectIdFilter(String(opt.key))}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', backgroundColor: themeStyles.bgCardHover, padding: '3px', borderRadius: '6px' }}>
            {(['Monthly', 'Quarterly'] as Timescale[]).map(t => (
              <button
                key={t}
                onClick={() => setTimescale(t)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: timescale === t ? themeStyles.accentBlue : 'transparent',
                  color: timescale === t ? '#fff' : themeStyles.textSecondary
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Gantt Grid Canvas */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflowX: 'auto',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Compiling interactive Gantt timeline..." />
          </div>
        ) : (
          <div style={{ minWidth: '980px', padding: '20px' }}>
            {/* Header: Months Grid */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '10px' }}>
              <div style={{ width: '280px', flexShrink: 0, fontWeight: 700, fontSize: '13px', color: themeStyles.textSecondary }}>
                Project & Work Items
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', textAlign: 'center', fontSize: '12px', color: themeStyles.textMuted, fontWeight: 600 }}>
                {months.map(m => (
                  <div key={m} style={{ borderLeft: `1px solid ${themeStyles.borderLight}`, padding: '4px 0' }}>
                    {m.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Rows per Project */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {/* Vertical Current Day Indicator Line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(280px + (100% - 280px) * ${parseFloat(todayLeft) / 100})`,
                  width: '2px',
                  backgroundColor: themeStyles.accentRed,
                  zIndex: 4,
                  pointerEvents: 'none'
                }}
                title="Current Date"
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '-22px',
                    backgroundColor: themeStyles.accentRed,
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: '3px'
                  }}
                >
                  TODAY
                </span>
              </div>

              {filteredProjects.map(p => {
                const pMetrics = getBarMetrics(p.startDate, p.endDate);
                const projectTasks = tasks.filter(t => t.projectId === p.id);
                const projectMilestones = milestones.filter(m => m.projectId === p.id);

                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '12px', borderBottom: `1px solid ${themeStyles.borderLight}` }}>
                    {/* Project Parent Bar */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '280px', flexShrink: 0, paddingRight: '12px' }}>
                        <div
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setActiveView('project-detail');
                          }}
                          style={{
                            fontWeight: 700,
                            fontSize: '13.5px',
                            color: themeStyles.textPrimary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{ fontSize: '11px', color: themeStyles.accentBlue }}>{p.projectId}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>
                          {new Date(p.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(p.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      {/* Bar Canvas */}
                      <div style={{ flex: 1, position: 'relative', height: '28px', backgroundColor: `${themeStyles.bgCardHover}88`, borderRadius: '6px' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: pMetrics.left,
                            width: pMetrics.width,
                            height: '100%',
                            backgroundColor: 'rgba(0, 168, 232, 0.25)',
                            border: `1px solid ${themeStyles.accentBlue}`,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}
                        >
                          {/* Progress fill */}
                          <div
                            style={{
                              height: '100%',
                              width: `${p.progress}%`,
                              background: 'linear-gradient(90deg, #0077b6 0%, #00a8e8 100%)',
                              borderRadius: '4px'
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              left: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#fff',
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                            }}
                          >
                            {p.progress}%
                          </span>
                        </div>

                        {/* Milestones Diamonds */}
                        {projectMilestones.map(m => {
                          const mPos = `${getPositionPercent(m.dueDate)}%`;
                          return (
                            <div
                              key={m.id}
                              style={{
                                position: 'absolute',
                                left: mPos,
                                top: '5px',
                                width: '16px',
                                height: '16px',
                                backgroundColor: m.status === 'Completed' ? themeStyles.accentGreen : themeStyles.accentAmber,
                                transform: 'rotate(45deg)',
                                zIndex: 3,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                cursor: 'pointer'
                              }}
                              title={`Milestone: ${m.title} (${m.status})`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Nested Task Bars */}
                    {projectTasks.map(t => {
                      const tMetrics = getBarMetrics(t.startDate, t.dueDate);
                      const isComplete = t.status === 'Completed';

                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                          <div style={{ width: '280px', flexShrink: 0, paddingLeft: '18px', paddingRight: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: themeStyles.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              ↳ {t.title}
                            </div>
                            <div style={{ fontSize: '10.5px', color: themeStyles.textMuted }}>
                              Assignee: {t.assignedTo?.title || 'Unassigned'}
                            </div>
                          </div>

                          <div style={{ flex: 1, position: 'relative', height: '18px' }}>
                            <div
                              style={{
                                position: 'absolute',
                                left: tMetrics.left,
                                width: tMetrics.width,
                                height: '100%',
                                backgroundColor: isComplete ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                                border: `1px solid ${isComplete ? themeStyles.accentGreen : themeStyles.accentAmber}`,
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${t.completionPercentage}%`,
                                  backgroundColor: isComplete ? themeStyles.accentGreen : themeStyles.accentAmber,
                                  borderRadius: '3px'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
