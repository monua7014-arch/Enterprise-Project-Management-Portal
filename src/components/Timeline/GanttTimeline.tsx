import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService, TaskService } from '../../services';
import { IProjectItem, ITaskItem, IMilestoneItem } from '../../models';
import { getStatusBadgeStyle } from '../../styles/theme';
import { 
  Dropdown, 
  IDropdownOption, 
  DefaultButton, 
  IconButton, 
  Spinner, 
  SpinnerSize,
  Dialog,
  DialogType,
  DialogFooter
} from '@fluentui/react';

type Timescale = 'Weekly' | 'Monthly' | 'Quarterly';

export const GanttTimeline: React.FC = () => {
  const { config, themeStyles, currentTheme, refreshTrigger, setSelectedProjectId, setActiveView } = useApp();
  const isDark = currentTheme === 'dark';

  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [milestones, setMilestones] = useState<IMilestoneItem[]>([]);
  const [selectedProjectIdFilter, setSelectedProjectIdFilter] = useState<string>('All');
  const [timescale, setTimescale] = useState<Timescale>('Monthly');
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<ITaskItem | null>(null);

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

  // Timeline Scale Calculations: Default Jan 1 2026 to Dec 31 2026
  const timelineStart = new Date('2026-01-01T00:00:00Z').getTime();
  const timelineEnd = new Date('2026-12-31T23:59:59Z').getTime();
  const totalDuration = timelineEnd - timelineStart;

  const months = [
    'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026',
    'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'
  ];

  const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];

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
    const width = Math.max(right - left, 2.5);
    return { left: `${left}%`, width: `${width}%` };
  };

  const nowTime = new Date().getTime();
  const todayLeft = `${getPositionPercent(new Date().toISOString())}%`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Banner & Scale Controls */}
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
          borderRadius: '12px',
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: themeStyles.textPrimary }}>
            Enterprise Gantt Schedule & Delivery Roadmap
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            Multi-tier timeline with milestone diamonds, delay indicators, and dependency markers
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: '220px' }}>
            <Dropdown
              selectedKey={selectedProjectIdFilter}
              options={[
                { key: 'All', text: 'All Enterprise Projects' },
                ...projects.map(p => ({ key: String(p.id), text: p.title }))
              ]}
              onChange={(_, opt) => opt && setSelectedProjectIdFilter(String(opt.key))}
              styles={{
                title: {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  borderColor: themeStyles.border,
                  borderRadius: '8px',
                  height: '34px',
                  lineHeight: '32px',
                  fontSize: '12px',
                  color: themeStyles.textPrimary
                }
              }}
            />
          </div>

          {/* Timescale Selector */}
          <div style={{ display: 'flex', gap: '3px', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', padding: '3px', borderRadius: '8px', border: `1px solid ${themeStyles.border}` }}>
            {(['Weekly', 'Monthly', 'Quarterly'] as Timescale[]).map(t => (
              <button
                key={t}
                onClick={() => setTimescale(t)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: timescale === t ? themeStyles.accentBlue : 'transparent',
                  color: timescale === t ? '#fff' : themeStyles.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Gantt Canvas */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflowX: 'auto',
          boxShadow: themeStyles.cardShadow
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Compiling multi-track Gantt timeline..." />
          </div>
        ) : (
          <div style={{ minWidth: '1050px', padding: '20px 24px' }}>
            {/* Header Columns Track */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${themeStyles.border}`, paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ width: '260px', fontWeight: 800, fontSize: '11px', color: themeStyles.textSecondary, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                WBS Workstream / Deliverable
              </div>
              <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                {timescale === 'Quarterly' ? (
                  quarters.map((q, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, borderLeft: `1px solid ${themeStyles.border}` }}>
                      {q}
                    </div>
                  ))
                ) : (
                  months.map((m, idx) => (
                    <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '10.5px', fontWeight: 700, color: themeStyles.textSecondary, borderLeft: `1px solid ${themeStyles.border}` }}>
                      {m.split(' ')[0]}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Project & Task Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {/* Today Vertical Reference Marker */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `calc(260px + (100% - 260px) * ${parseFloat(todayLeft) / 100})`,
                  width: '2px',
                  backgroundColor: '#f43f5e',
                  zIndex: 4,
                  pointerEvents: 'none'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#f43f5e',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '2px 5px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  TODAY
                </div>
              </div>

              {filteredProjects.map(p => {
                const pMetrics = getBarMetrics(p.startDate, p.endDate);
                const projectTasks = tasks.filter(t => t.projectId === p.id);
                const projectMilestones = milestones.filter(m => m.projectId === p.id);

                return (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px', borderBottom: `1px solid ${themeStyles.borderLight}` }}>
                    {/* Project Parent Bar */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: '260px', paddingRight: '14px' }}>
                        <div
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setActiveView('project-detail');
                          }}
                          style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {p.title}
                        </div>
                        <div style={{ fontSize: '11px', color: themeStyles.textSecondary }}>
                          {p.projectId} • {p.progress}% Complete
                        </div>
                      </div>

                      <div style={{ flex: 1, position: 'relative', height: '24px', backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '6px' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: pMetrics.left,
                            width: pMetrics.width,
                            height: '100%',
                            borderRadius: '6px',
                            background: p.status === 'Delayed'
                              ? 'linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)'
                              : 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 100%)',
                            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 10px',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.clientName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Child Tasks Tracks */}
                    {projectTasks.map(t => {
                      const tMetrics = getBarMetrics(t.startDate, t.dueDate);
                      const isDelayed = t.status !== 'Completed' && new Date(t.dueDate).getTime() < nowTime;

                      return (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '260px', paddingLeft: '16px', paddingRight: '14px' }}>
                            <div
                              onClick={() => setSelectedTaskDetail(t)}
                              style={{
                                fontSize: '11.5px',
                                color: isDelayed ? '#f43f5e' : themeStyles.textPrimary,
                                cursor: 'pointer',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>↳ {t.title}</span>
                              {isDelayed && (
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.15)', padding: '1px 4px', borderRadius: '3px' }}>
                                  OVERDUE
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ flex: 1, position: 'relative', height: '18px' }}>
                            <div
                              onClick={() => setSelectedTaskDetail(t)}
                              style={{
                                position: 'absolute',
                                left: tMetrics.left,
                                width: tMetrics.width,
                                height: '12px',
                                top: '3px',
                                borderRadius: '4px',
                                backgroundColor: t.status === 'Completed'
                                  ? '#10b981'
                                  : isDelayed
                                  ? '#f43f5e'
                                  : '#38bdf8',
                                opacity: 0.85,
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scaleY(1.3)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scaleY(1)'}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Milestone Markers Track */}
                    {projectMilestones.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '260px', paddingLeft: '16px', fontSize: '11px', color: themeStyles.accentAmber, fontWeight: 700 }}>
                          ◆ Milestones Sign-offs
                        </div>
                        <div style={{ flex: 1, position: 'relative', height: '20px' }}>
                          {projectMilestones.map(m => {
                            const leftPos = getPositionPercent(m.dueDate);
                            return (
                              <div
                                key={m.id}
                                title={`${m.title} (Due: ${new Date(m.dueDate).toLocaleDateString()})`}
                                style={{
                                  position: 'absolute',
                                  left: `${leftPos}%`,
                                  top: '2px',
                                  transform: 'translateX(-50%) rotate(45deg)',
                                  width: '12px',
                                  height: '12px',
                                  backgroundColor: m.status === 'Completed' ? '#10b981' : '#f59e0b',
                                  boxShadow: '0 0 6px rgba(245, 158, 11, 0.6)',
                                  cursor: 'pointer'
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskDetail && (
        <Dialog
          hidden={!selectedTaskDetail}
          onDismiss={() => setSelectedTaskDetail(null)}
          dialogContentProps={{
            type: DialogType.normal,
            title: `Task Details: ${selectedTaskDetail.taskId}`,
            subText: selectedTaskDetail.title
          }}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, color: themeStyles.textPrimary }
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>
              {selectedTaskDetail.description}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11.5px' }}>
              <div>Status: <b>{selectedTaskDetail.status}</b></div>
              <div>Priority: <b>{selectedTaskDetail.priority}</b></div>
              <div>Due Date: <b>{new Date(selectedTaskDetail.dueDate).toLocaleDateString()}</b></div>
              <div>Assigned: <b>{selectedTaskDetail.assignedTo?.title || 'Unassigned'}</b></div>
            </div>
          </div>
          <DialogFooter>
            <DefaultButton text="Close" onClick={() => setSelectedTaskDetail(null)} />
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
};
