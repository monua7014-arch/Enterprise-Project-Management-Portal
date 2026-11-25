import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services';
import { ITaskItem, TaskStatus, PriorityLevel } from '../../models';
import { TaskModal } from './TaskModal';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  ProgressIndicator, 
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

export const KanbanBoard: React.FC = () => {
  const { config, themeStyles, setActiveView, refreshTrigger, triggerRefresh, showToast } = useApp();
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // Modal for new/edit task
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<ITaskItem | null>(null);
  const [defaultColForNewTask, setDefaultColForNewTask] = useState<TaskStatus>('To Do');

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
          padding: '16px 20px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Interactive Workflow Kanban Board
          </h2>
          <div style={{ fontSize: '12px', color: themeStyles.textMuted }}>
            Drag and drop cards between workflow columns to update delivery status in SharePoint.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Switch to Table View"
            iconProps={{ iconName: 'List' }}
            onClick={() => setActiveView('tasks')}
            styles={{ root: { borderRadius: '6px' } }}
          />
          <PrimaryButton
            text="New Task"
            iconProps={{ iconName: 'Add' }}
            onClick={() => {
              setEditingTask(null);
              setDefaultColForNewTask('To Do');
              setIsModalOpen(true);
            }}
            styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
          />
        </div>
      </div>

      {/* 4-Column Board Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '18px',
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
                backgroundColor: isOver ? 'rgba(0, 168, 232, 0.08)' : themeStyles.bgCard,
                border: isOver ? `2px dashed ${themeStyles.accentBlue}` : `1px solid ${themeStyles.border}`,
                borderRadius: '12px',
                padding: '16px',
                minHeight: '520px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: `1px solid ${themeStyles.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: col.color }} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: themeStyles.textPrimary }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: themeStyles.bgCardHover,
                      color: themeStyles.textSecondary,
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <IconButton
                  iconProps={{ iconName: 'Add' }}
                  title={`Add to ${col.label}`}
                  onClick={() => {
                    setEditingTask(null);
                    setDefaultColForNewTask(col.status);
                    setIsModalOpen(true);
                  }}
                  styles={{ root: { color: themeStyles.textSecondary, width: '28px', height: '28px' } }}
                />
              </div>

              {/* Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {colTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 16px',
                      textAlign: 'center',
                      color: themeStyles.textMuted,
                      fontSize: '12px',
                      border: `1px dashed ${themeStyles.border}`,
                      borderRadius: '8px'
                    }}
                  >
                    Drop items here
                  </div>
                ) : (
                  colTasks.map(t => {
                    const isOverdue = t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now();
                    const priorityColor =
                      t.priority === 'Critical' ? '#ef4444' :
                      t.priority === 'High' ? '#f97316' :
                      t.priority === 'Medium' ? '#f59e0b' : '#10b981';

                    return (
                      <div
                        key={t.id}
                        draggable={true}
                        onDragStart={e => handleDragStart(e, t.id)}
                        onClick={() => {
                          setEditingTask(t);
                          setIsModalOpen(true);
                        }}
                        style={{
                          padding: '14px',
                          backgroundColor: themeStyles.bgCardHover,
                          border: `1px solid ${themeStyles.border}`,
                          borderRadius: '8px',
                          cursor: 'grab',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        {/* Top: Priority & Task ID */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: `${priorityColor}1a`,
                              color: priorityColor
                            }}
                          >
                            {t.priority}
                          </span>
                          <span style={{ fontSize: '11px', color: themeStyles.textMuted, fontWeight: 600 }}>
                            {t.taskId}
                          </span>
                        </div>

                        {/* Title */}
                        <div style={{ fontSize: '13px', fontWeight: 600, color: themeStyles.textPrimary, lineHeight: 1.4 }}>
                          {t.title}
                        </div>

                        {/* Project Subtitle */}
                        <div style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 500 }}>
                          {t.projectTitle || `Project #${t.projectId}`}
                        </div>

                        {/* Progress */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: themeStyles.textMuted, marginBottom: '2px' }}>
                            <span>Progress</span>
                            <span>{t.completionPercentage}%</span>
                          </div>
                          <ProgressIndicator
                            percentComplete={t.completionPercentage / 100}
                            styles={{ progressBar: { backgroundColor: col.color } }}
                          />
                        </div>

                        {/* Footer: Assignee & Due Date */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: '4px',
                            paddingTop: '6px',
                            borderTop: `1px solid ${themeStyles.border}`,
                            fontSize: '11px'
                          }}
                        >
                          <span style={{ color: themeStyles.textSecondary, fontWeight: 500 }}>
                            {t.assignedTo?.title || 'Unassigned'}
                          </span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: isOverdue ? themeStyles.accentRed : themeStyles.textMuted
                            }}
                          >
                            {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        taskToEdit={editingTask}
        defaultStatus={defaultColForNewTask}
        onDismiss={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />
    </div>
  );
};
