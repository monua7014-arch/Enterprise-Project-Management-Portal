import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService, TaskService, ReportingService } from '../../services';
import { IProjectItem, ITaskItem } from '../../models';
import { 
  PrimaryButton, 
  DefaultButton, 
  Dropdown, 
  IDropdownOption, 
  SearchBox, 
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

type ReportType = 'project-status' | 'task-status' | 'overdue-risk' | 'workload';

export const ReportsDashboard: React.FC = () => {
  const { config, themeStyles, refreshTrigger, globalSearch } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [reportType, setReportType] = useState<ReportType>('project-status');
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [config, refreshTrigger]);

  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, tList] = await Promise.all([
        ProjectService.getInstance().getProjects(config),
        TaskService.getInstance().getTasks(config)
      ]);
      setProjects(pList);
      setTasks(tList);
    } catch (err) {
      console.error('[ReportsDashboard] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'project-status' || reportType === 'overdue-risk') {
      ReportingService.getInstance().exportProjectsToExcel(projects);
    } else {
      ReportingService.getInstance().exportTasksToExcel(tasks);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypeOptions: IDropdownOption[] = [
    { key: 'project-status', text: 'Project Status & Budget Report' },
    { key: 'task-status', text: 'Task Delivery & Status Report' },
    { key: 'overdue-risk', text: 'Overdue Risk Audit Report' },
    { key: 'workload', text: 'Team Workload & Capacity Summary' }
  ];

  // Overdue tasks
  const overdueTasks = useMemo(() => {
    const now = Date.now();
    return tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < now);
  }, [tasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Banner & Report Selector */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Executive Analytics & Compliance Reports
            </h2>
            <div style={{ fontSize: '12.5px', color: themeStyles.textMuted, marginTop: '2px' }}>
              Export formal portfolio audit reports in Microsoft Excel or print-ready PDF formats.
            </div>
          </div>

          <div style={{ width: '260px' }}>
            <Dropdown
              selectedKey={reportType}
              options={reportTypeOptions}
              onChange={(_, opt) => opt && setReportType(opt.key as ReportType)}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Print / PDF View"
            iconProps={{ iconName: 'Print' }}
            onClick={handlePrint}
            styles={{ root: { borderRadius: '6px' } }}
          />
          <PrimaryButton
            text="Export to Excel (.xlsx)"
            iconProps={{ iconName: 'ExcelLogo' }}
            onClick={handleExportExcel}
            styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
          />
        </div>
      </div>

      {/* Content based on Report Type */}
      <div
        style={{
          padding: '24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflowX: 'auto'
        }}
      >
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Compiling report data..." />
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
                {reportTypeOptions.find(o => o.key === reportType)?.text}
              </h3>
              <div style={{ fontSize: '12px', color: themeStyles.textMuted }}>
                Generated on: {new Date().toLocaleString()}
              </div>
            </div>

            {reportType === 'project-status' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: themeStyles.bgCardHover, borderBottom: `1px solid ${themeStyles.border}` }}>
                    <th style={{ padding: '10px 14px' }}>Project ID</th>
                    <th style={{ padding: '10px 14px' }}>Name</th>
                    <th style={{ padding: '10px 14px' }}>Client</th>
                    <th style={{ padding: '10px 14px' }}>Manager</th>
                    <th style={{ padding: '10px 14px' }}>Budget</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                    <th style={{ padding: '10px 14px' }}>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: themeStyles.accentBlue }}>{p.projectId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: themeStyles.textPrimary }}>{p.title}</td>
                      <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>{p.clientName}</td>
                      <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>{p.projectManager?.title || 'Unassigned'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>${p.budget.toLocaleString()}</td>
                      <td style={{ padding: '12px 14px' }}>{p.status}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>{p.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'task-status' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: themeStyles.bgCardHover, borderBottom: `1px solid ${themeStyles.border}` }}>
                    <th style={{ padding: '10px 14px' }}>Task ID</th>
                    <th style={{ padding: '10px 14px' }}>Title</th>
                    <th style={{ padding: '10px 14px' }}>Project</th>
                    <th style={{ padding: '10px 14px' }}>Assignee</th>
                    <th style={{ padding: '10px 14px' }}>Due Date</th>
                    <th style={{ padding: '10px 14px' }}>Priority</th>
                    <th style={{ padding: '10px 14px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: themeStyles.accentBlue }}>{t.taskId}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: themeStyles.textPrimary }}>{t.title}</td>
                      <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>{t.projectTitle || `#${t.projectId}`}</td>
                      <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>{t.assignedTo?.title || 'Unassigned'}</td>
                      <td style={{ padding: '12px 14px', color: themeStyles.textMuted }}>{new Date(t.dueDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px' }}>{t.priority}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'overdue-risk' && (
              <div>
                {overdueTasks.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.accentGreen, fontWeight: 600 }}>
                    Excellent! Zero overdue tasks detected across all active projects.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderBottom: `1px solid ${themeStyles.border}` }}>
                        <th style={{ padding: '10px 14px' }}>Task ID</th>
                        <th style={{ padding: '10px 14px' }}>Overdue Item</th>
                        <th style={{ padding: '10px 14px' }}>Project</th>
                        <th style={{ padding: '10px 14px' }}>Responsible Assignee</th>
                        <th style={{ padding: '10px 14px' }}>Target Due Date</th>
                        <th style={{ padding: '10px 14px' }}>Priority Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overdueTasks.map(t => (
                        <tr key={t.id} style={{ borderBottom: `1px solid ${themeStyles.border}`, color: themeStyles.accentRed }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>{t.taskId}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 600 }}>{t.title}</td>
                          <td style={{ padding: '12px 14px' }}>{t.projectTitle || `#${t.projectId}`}</td>
                          <td style={{ padding: '12px 14px' }}>{t.assignedTo?.title || 'Unassigned'}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>{new Date(t.dueDate).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>{t.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {reportType === 'workload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', color: themeStyles.textSecondary }}>
                  Active task distribution per team member:
                </div>
                {Array.from(new Set(tasks.map(t => t.assignedTo?.title || 'Unassigned'))).map(assignee => {
                  const assignedTasks = tasks.filter(t => (t.assignedTo?.title || 'Unassigned') === assignee);
                  const completed = assignedTasks.filter(t => t.status === 'Completed').length;
                  const inFlight = assignedTasks.length - completed;

                  return (
                    <div
                      key={assignee}
                      style={{
                        padding: '14px 18px',
                        backgroundColor: themeStyles.bgCardHover,
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
                          {assignee}
                        </div>
                        <div style={{ fontSize: '12px', color: themeStyles.textMuted }}>
                          {assignedTasks.length} total assignments ({completed} completed, {inFlight} active)
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: inFlight > 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: inFlight > 3 ? themeStyles.accentRed : themeStyles.accentGreen,
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {inFlight > 3 ? 'High Workload' : 'Optimal Capacity'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
