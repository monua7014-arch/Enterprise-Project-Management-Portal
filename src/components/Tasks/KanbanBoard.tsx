import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services';
import { ITaskItem, TaskStatus, PriorityLevel } from '../../models';
import { TaskModal } from './TaskModal';
import { getStatusBadgeStyle } from '../../styles/theme';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  Spinner, 
  SpinnerSize,
  Dialog,
  DialogType,
  DialogFooter
} from '@fluentui/react';

export const KanbanBoard: React.FC = () => {
  const { config, themeStyles, currentTheme, setActiveView, refreshTrigger, triggerRefresh, showToast } = useApp();
  const isDark = currentTheme === 'dark';

  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // Modal for new/edit task
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ITaskItem | null>(null);
  const [defaultColForNewTask, setDefaultColForNewTask] = useState<TaskStatus>('To Do');
  const [taskDetailPopup, setTaskDetailPopup] = useState<ITaskItem | null>(null);

  useEffect(() => {
    loadTasks();
  }, [config, refreshTrigger]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const tList = await TaskService.getInstance().getTasks(config);
      setTasks(tList);
    } catch (err) {
      console.error('[KanbanBoard] Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskIdStr = e.dataTransfer.getData('text/plain');
    const taskId = Number(taskIdStr);
    if (!taskId) return;

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask || currentTask.status === targetStatus) return;

    // Optimistically update UI
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              completionPercentage: targetStatus === 'Completed' ? 100 : targetStatus === 'To Do' ? 0 : t.completionPercentage
            }
          : t
      )
    );

    try {
      await TaskService.getInstance().updateTaskStatus(taskId, targetStatus, config);
      showToast(`Task '${currentTask.title}' moved to ${targetStatus}.`, 'success');
      triggerRefresh();
    } catch (err) {
      showToast('Error persisting status change to SharePoint.', 'error');
      loadTasks();
    }
  };

  const handleSaveTask = async (taskData: Partial<ITaskItem>) => {
    if (editingTask) {
      await TaskService.getInstance().updateTask(editingTask.id, taskData, config);
      showToast(`Task updated.`, 'success');
    } else {
      await TaskService.getInstance().createTask(taskData as Omit<ITaskItem, 'id'>, config);
      showToast(`New task created.`, 'success');
    }
    triggerRefresh();
  };

  const columns: { status: TaskStatus; label: string; color: string }[] = [
    { status: 'To Do', label: 'To Do / Backlog', color: '#94a3b8' },
    { status: 'In Progress', label: 'In Progress', color: themeStyles.accentBlue },
    { status: 'Under Review', label: 'Under Review', color: themeStyles.accentAmber },
    { status: 'Completed', label: 'Completed', color: themeStyles.accentGreen }
  ];

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spinner size={SpinnerSize.large} label="Loading Kanban board from SharePoint..." />
      </div>
    );
  }

  const nowTime = new Date().getTime();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '20px 24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: themeStyles.textPrimary }}>
            Interactive Workflow Kanban Board
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            Drag and drop workstream cards between status swimlanes to auto-sync with SharePoint
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Switch to Table View"
            iconProps={{ iconName: 'List' }}
            onClick={() => setActiveView('tasks')}
            styles={{
              root: {
                borderRadius: '8px',
                height: '36px',
                borderColor: themeStyles.border,
                backgroundColor: themeStyles.bgCard,
                color: themeStyles.textPrimary
              }
            }}
          />
          <PrimaryButton
            text="New Task"
            iconProps={{ iconName: 'Add' }}
            onClick={() => {
              setEditingTask(null);
              setDefaultColForNewTask('To Do');
              setIsModalOpen(true);
            }}
            styles={{
              root: {
                backgroundColor: themeStyles.accentBlue,
                borderRadius: '8px',
                height: '36px',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
              }
            }}
          />
        </div>
      </div>

      {/* Kanban Swimlanes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status);
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={e => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, col.status)}
              style={{
                backgroundColor: isOver
                  ? isDark ? 'rgba(14, 165, 233, 0.12)' : '#e0f2fe'
                  : themeStyles.bgCard,
                border: `1px solid ${isOver ? themeStyles.accentBlue : themeStyles.border}`,
                borderRadius: '12px',
                padding: '16px',
                minHeight: '520px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.18s ease',
                boxShadow: themeStyles.cardShadow
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: `1px solid ${themeStyles.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: '13px', color: themeStyles.textPrimary }}>
                    {col.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    color: themeStyles.textSecondary,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {colTasks.map(t => {
                  const isOverdue = t.status !== 'Completed' && new Date(t.dueDate).getTime() < nowTime;

                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={e => handleDragStart(e, t.id)}
                      onClick={() => setTaskDetailPopup(t)}
                      style={{
                        padding: '14px',
                        backgroundColor: isDark ? '#111a30' : '#ffffff',
                        border: `1px solid ${isOverdue ? 'rgba(244,63,94,0.4)' : themeStyles.border}`,
                        borderRadius: '10px',
                        cursor: 'grab',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'transform 0.15s ease, border-color 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = themeStyles.accentBlue;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = isOverdue ? 'rgba(244,63,94,0.4)' : themeStyles.border;
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: themeStyles.accentBlue }}>
                          {t.taskId}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {isOverdue && (
                            <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                              OVERDUE
                            </span>
                          )}
                          <span style={getStatusBadgeStyle(t.priority, isDark)}>
                            {t.priority}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: themeStyles.textPrimary, lineHeight: 1.3 }}>
                        {t.title}
                      </div>

                      {t.projectTitle && (
                        <div style={{ fontSize: '11px', color: themeStyles.textSecondary }}>
                          {t.projectTitle}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: `1px solid ${themeStyles.borderLight}`, fontSize: '11px', color: themeStyles.textMuted }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="ms-Icon ms-Icon--Calendar" style={{ fontSize: '12px' }} />
                          <span>{new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: themeStyles.textSecondary }}>
                          {t.assignedTo?.title?.split(' ')[0] || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Quick View Dialog */}
      {taskDetailPopup && (
        <Dialog
          hidden={!taskDetailPopup}
          onDismiss={() => setTaskDetailPopup(null)}
          dialogContentProps={{
            type: DialogType.normal,
            title: `${taskDetailPopup.taskId}: ${taskDetailPopup.title}`,
            subText: taskDetailPopup.description
          }}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, color: themeStyles.textPrimary }
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', fontSize: '12px' }}>
            <div>Project: <b>{taskDetailPopup.projectTitle || 'Primary Workstream'}</b></div>
            <div>Assigned To: <b>{taskDetailPopup.assignedTo?.title || 'Unassigned'}</b></div>
            <div>Due Date: <b>{new Date(taskDetailPopup.dueDate).toLocaleDateString()}</b></div>
            <div>Completion: <b>{taskDetailPopup.completionPercentage}%</b></div>
          </div>
          <DialogFooter>
            <PrimaryButton
              text="Edit Task"
              onClick={() => {
                setEditingTask(taskDetailPopup);
                setTaskDetailPopup(null);
                setIsModalOpen(true);
              }}
            />
            <DefaultButton text="Close" onClick={() => setTaskDetailPopup(null)} />
          </DialogFooter>
        </Dialog>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <TaskModal
          isOpen={isModalOpen}
          taskToEdit={editingTask}
          defaultStatus={defaultColForNewTask}
          onDismiss={() => setIsModalOpen(false)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};
