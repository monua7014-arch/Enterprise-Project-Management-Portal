import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskService, ProjectService, ReportingService } from '../../services';
import { ITaskItem, IProjectItem, TaskStatus, PriorityLevel } from '../../models';
import { TaskModal } from './TaskModal';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  SearchBox, 
  Dropdown, 
  IDropdownOption, 
  ProgressIndicator, 
  Dialog, 
  DialogType, 
  DialogFooter, 
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

export const TaskList: React.FC = () => {
  const { 
    config, 
    themeStyles, 
    setActiveView, 
    refreshTrigger, 
    triggerRefresh, 
    showToast,
    globalSearch 
  } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  
  // Modal & Dialog
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ITaskItem | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<ITaskItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

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
      const [tList, pList] = await Promise.all([
        TaskService.getInstance().getTasks(config),
        ProjectService.getInstance().getProjects(config)
      ]);
      setTasks(tList);
      setProjects(pList);
    } catch (err) {
      console.error('[TaskList] Error loading tasks:', err);
      showToast('Error loading tasks from SharePoint.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (taskData: Partial<ITaskItem>) => {
    const service = TaskService.getInstance();
    if (editingTask) {
      await service.updateTask(editingTask.id, taskData, config);
      showToast(`Task '${taskData.title}' updated.`, 'success');
    } else {
      await service.createTask(taskData as Omit<ITaskItem, 'id'>, config);
      showToast(`New task '${taskData.title}' created in SharePoint.`, 'success');
    }
    triggerRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await TaskService.getInstance().deleteTask(taskToDelete.id, config);
      showToast(`Task '${taskToDelete.title}' deleted.`, 'success');
      setTaskToDelete(null);
      triggerRefresh();
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const projectOptions: IDropdownOption[] = [
    { key: 'All', text: 'All Projects' },
    ...projects.map(p => ({ key: String(p.id), text: p.title }))
  ];

  const getStatusBadge = (status: TaskStatus) => {
    const map: { [key: string]: { bg: string; text: string } } = {
      'To Do': { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
      'In Progress': { bg: 'rgba(0, 168, 232, 0.15)', text: '#00a8e8' },
      'Under Review': { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
      Completed: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' }
    };
    const c = map[status] || map['To Do'];
    return (
      <span
        style={{
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: c.bg,
          color: c.text
        }}
      >
        {status}
      </span>
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.taskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.assignedTo?.title || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchProject = projectFilter === 'All' || String(t.projectId) === projectFilter;
      const matchStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;

      return matchSearch && matchProject && matchStatus && matchPriority;
    });
  }, [tasks, searchQuery, projectFilter, statusFilter, priorityFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Action & Filter Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          padding: '16px 20px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ width: '220px' }}>
            <SearchBox
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(_, val) => setSearchQuery(val || '')}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Dropdown
              selectedKey={projectFilter}
              options={projectOptions}
              onChange={(_, opt) => opt && setProjectFilter(String(opt.key))}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '140px' }}>
            <Dropdown
              selectedKey={statusFilter}
              options={[
                { key: 'All', text: 'All Statuses' },
                { key: 'To Do', text: 'To Do' },
                { key: 'In Progress', text: 'In Progress' },
                { key: 'Under Review', text: 'Under Review' },
                { key: 'Completed', text: 'Completed' }
              ]}
              onChange={(_, opt) => opt && setStatusFilter(String(opt.key))}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '130px' }}>
            <Dropdown
              selectedKey={priorityFilter}
              options={[
                { key: 'All', text: 'All Priorities' },
                { key: 'Critical', text: 'Critical' },
                { key: 'High', text: 'High' },
                { key: 'Medium', text: 'Medium' },
                { key: 'Low', text: 'Low' }
              ]}
              onChange={(_, opt) => opt && setPriorityFilter(String(opt.key))}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Kanban Board View"
            iconProps={{ iconName: 'Tiles' }}
            onClick={() => setActiveView('kanban')}
            styles={{ root: { borderRadius: '6px' } }}
          />
          <DefaultButton
            text="Export Tasks"
            iconProps={{ iconName: 'ExcelLogo' }}
            onClick={() => ReportingService.getInstance().exportTasksToExcel(filteredTasks)}
            styles={{ root: { borderRadius: '6px' } }}
          />
          <PrimaryButton
            text="New Task"
            iconProps={{ iconName: 'Add' }}
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Loading tasks from SharePoint..." />
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: themeStyles.textMuted }}>
            <i className="ms-Icon ms-Icon--TaskGroup" style={{ fontSize: '36px', marginBottom: '12px', display: 'block' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No tasks found</div>
            <div style={{ fontSize: '13px' }}>Try adjusting your filters or create a new work item.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: themeStyles.bgCardHover,
                    borderBottom: `1px solid ${themeStyles.border}`,
                    color: themeStyles.textSecondary,
                    fontWeight: 600
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Task ID</th>
                  <th style={{ padding: '12px 16px' }}>Task Title</th>
                  <th style={{ padding: '12px 16px' }}>Project</th>
                  <th style={{ padding: '12px 16px' }}>Assignee</th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Due Date</th>
                  <th style={{ padding: '12px 16px' }}>Progress</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t, idx) => {
                  const isOverdue = t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now();
                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: `1px solid ${themeStyles.border}`,
                        backgroundColor: idx % 2 === 0 ? 'transparent' : `${themeStyles.bgCardHover}55`
                      }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: themeStyles.accentBlue }}>
                        {t.taskId}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textPrimary }}>
                        {t.title}
                      </td>
                      <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                        {t.projectTitle || `Project #${t.projectId}`}
                      </td>
                      <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                        {t.assignedTo?.title || 'Unassigned'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{t.priority}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {getStatusBadge(t.status)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: isOverdue ? 700 : 500,
                            color: isOverdue ? themeStyles.accentRed : themeStyles.textSecondary
                          }}
                        >
                          {new Date(t.dueDate).toLocaleDateString()}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', width: '100px' }}>
                        <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginBottom: '2px' }}>
                          {t.completionPercentage}%
                        </div>
                        <ProgressIndicator
                          percentComplete={t.completionPercentage / 100}
                          styles={{ progressBar: { backgroundColor: themeStyles.accentBlue } }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <IconButton
                          iconProps={{ iconName: 'Edit' }}
                          title="Edit Task"
                          onClick={() => {
                            setEditingTask(t);
                            setIsModalOpen(true);
                          }}
                          styles={{ root: { color: themeStyles.textSecondary } }}
                        />
                        <IconButton
                          iconProps={{ iconName: 'Delete' }}
                          title="Delete Task"
                          onClick={() => setTaskToDelete(t)}
                          styles={{ root: { color: themeStyles.accentRed } }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        taskToEdit={editingTask}
        onDismiss={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* Delete Confirmation */}
      <Dialog
        hidden={!taskToDelete}
        onDismiss={() => setTaskToDelete(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirm Task Deletion',
          subText: `Are you sure you want to delete task '${taskToDelete?.title}'?`
        }}
      >
        <DialogFooter>
          <PrimaryButton
            text={deleting ? 'Deleting...' : 'Delete'}
            onClick={handleDeleteConfirm}
            disabled={deleting}
            styles={{ root: { backgroundColor: themeStyles.accentRed, borderColor: themeStyles.accentRed } }}
          />
          <DefaultButton text="Cancel" onClick={() => setTaskToDelete(null)} disabled={deleting} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};
