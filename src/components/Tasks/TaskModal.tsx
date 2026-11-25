import * as React from 'react';
import { useState, useEffect } from 'react';
import { 
  Modal, 
  TextField, 
  PrimaryButton, 
  DefaultButton, 
  Dropdown, 
  IDropdownOption, 
  Slider, 
  IconButton,
  MessageBar,
  MessageBarType
} from '@fluentui/react';
import { ITaskItem, IProjectItem, TaskStatus, PriorityLevel } from '../../models';
import { useApp } from '../../context/AppContext';
import { ProjectService } from '../../services';

interface ITaskModalProps {
  isOpen: boolean;
  taskToEdit?: ITaskItem | null;
  defaultStatus?: TaskStatus;
  onDismiss: () => void;
  onSave: (task: Partial<ITaskItem>) => Promise<void>;
}

export const TaskModal: React.FC<ITaskModalProps> = ({
  isOpen,
  taskToEdit,
  defaultStatus = 'To Do',
  onDismiss,
  onSave
}) => {
  const { themeStyles, config } = useApp();
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [formData, setFormData] = useState({
    taskId: '',
    projectId: 0,
    title: '',
    description: '',
    assignedName: '',
    assignedEmail: '',
    startDate: '',
    dueDate: '',
    priority: 'Medium' as PriorityLevel,
    status: defaultStatus,
    completionPercentage: 0
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    loadProjects();
  }, [config, isOpen]);

  useEffect(() => {
    if (taskToEdit) {
      setFormData({
        taskId: taskToEdit.taskId || '',
        projectId: taskToEdit.projectId || 0,
        title: taskToEdit.title || '',
        description: taskToEdit.description || '',
        assignedName: taskToEdit.assignedTo?.title || '',
        assignedEmail: taskToEdit.assignedTo?.email || '',
        startDate: taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '',
        dueDate: taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '',
        priority: taskToEdit.priority || 'Medium',
        status: taskToEdit.status || defaultStatus,
        completionPercentage: taskToEdit.completionPercentage || 0
      });
    } else {
      const generatedId = `TSK-${Math.floor(100 + Math.random() * 900)}`;
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      setFormData({
        taskId: generatedId,
        projectId: projects[0]?.id || 0,
        title: '',
        description: '',
        assignedName: '',
        assignedEmail: '',
        startDate: today,
        dueDate: nextWeek,
        priority: 'Medium',
        status: defaultStatus,
        completionPercentage: defaultStatus === 'Completed' ? 100 : 0
      });
    }
    setErrorMessage('');
  }, [taskToEdit, isOpen, defaultStatus, projects]);

  const loadProjects = async () => {
    try {
      const pList = await ProjectService.getInstance().getProjects(config);
      setProjects(pList);
    } catch (err) {
      console.error('[TaskModal] Error loading projects:', err);
    }
  };

  const projectOptions: IDropdownOption[] = projects.map(p => ({
    key: p.id,
    text: `${p.projectId}: ${p.title}`
  }));

  const statusOptions: IDropdownOption[] = [
    { key: 'To Do', text: 'To Do' },
    { key: 'In Progress', text: 'In Progress' },
    { key: 'Under Review', text: 'Under Review' },
    { key: 'Completed', text: 'Completed' }
  ];

  const priorityOptions: IDropdownOption[] = [
    { key: 'Low', text: 'Low' },
    { key: 'Medium', text: 'Medium' },
    { key: 'High', text: 'High' },
    { key: 'Critical', text: 'Critical' }
  ];

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setErrorMessage('Task Title is required.');
      return;
    }
    if (!formData.projectId) {
      setErrorMessage('Please select an associated project.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      const selectedProject = projects.find(p => p.id === formData.projectId);
      await onSave({
        taskId: formData.taskId,
        projectId: formData.projectId,
        projectTitle: selectedProject?.title || '',
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedName ? {
          id: taskToEdit?.assignedTo?.id || 0,
          title: formData.assignedName,
          email: formData.assignedEmail
        } : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString(),
        priority: formData.priority,
        status: formData.status,
        completionPercentage: Number(formData.completionPercentage)
      });
      onDismiss();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      isBlocking={false}
      styles={{
        main: {
          width: '640px',
          maxWidth: '90vw',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${themeStyles.border}`
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: themeStyles.textPrimary }}>
          {taskToEdit ? 'Edit Task' : 'Create New Work Item / Task'}
        </h2>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close"
          onClick={onDismiss}
          styles={{ root: { color: themeStyles.textSecondary } }}
        />
      </div>

      <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
        {errorMessage && (
          <MessageBar
            messageBarType={MessageBarType.error}
            onDismiss={() => setErrorMessage('')}
            styles={{ root: { marginBottom: '16px' } }}
          >
            {errorMessage}
          </MessageBar>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <TextField
            label="Task ID"
            value={formData.taskId}
            onChange={(_, val) => setFormData(p => ({ ...p, taskId: val || '' }))}
          />
          <Dropdown
            label="Associated Project"
            required
            selectedKey={formData.projectId}
            options={projectOptions}
            onChange={(_, opt) => opt && setFormData(p => ({ ...p, projectId: Number(opt.key) }))}
          />
        </div>

        <div style={{ marginTop: '14px' }}>
          <TextField
            label="Task Title"
            required
            value={formData.title}
            onChange={(_, val) => setFormData(p => ({ ...p, title: val || '' }))}
          />
        </div>

        <div style={{ marginTop: '14px' }}>
          <TextField
            label="Description & Acceptance Criteria"
            multiline
            rows={3}
            value={formData.description}
            onChange={(_, val) => setFormData(p => ({ ...p, description: val || '' }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
          <TextField
            label="Assignee Name"
            value={formData.assignedName}
            onChange={(_, val) => setFormData(p => ({ ...p, assignedName: val || '' }))}
          />
          <TextField
            label="Assignee Email"
            value={formData.assignedEmail}
            onChange={(_, val) => setFormData(p => ({ ...p, assignedEmail: val || '' }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
          <TextField
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(_, val) => setFormData(p => ({ ...p, startDate: val || '' }))}
          />
          <TextField
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(_, val) => setFormData(p => ({ ...p, dueDate: val || '' }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
          <Dropdown
            label="Status"
            selectedKey={formData.status}
            options={statusOptions}
            onChange={(_, opt) => {
              if (opt) {
                const s = opt.key as TaskStatus;
                let c = formData.completionPercentage;
                if (s === 'Completed') c = 100;
                else if (s === 'To Do') c = 0;
                setFormData(p => ({ ...p, status: s, completionPercentage: c }));
              }
            }}
          />
          <Dropdown
            label="Priority"
            selectedKey={formData.priority}
            options={priorityOptions}
            onChange={(_, opt) => opt && setFormData(p => ({ ...p, priority: opt.key as PriorityLevel }))}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Slider
            label={`Progress: ${formData.completionPercentage}%`}
            min={0}
            max={100}
            step={5}
            value={formData.completionPercentage}
            onChange={val => setFormData(p => ({ ...p, completionPercentage: val }))}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          borderTop: `1px solid ${themeStyles.border}`,
          backgroundColor: themeStyles.bgCardHover
        }}
      >
        <DefaultButton text="Cancel" onClick={onDismiss} disabled={saving} />
        <PrimaryButton
          text={saving ? 'Saving...' : taskToEdit ? 'Update Task' : 'Create Task'}
          onClick={handleSubmit}
          disabled={saving}
          styles={{ root: { backgroundColor: themeStyles.accentBlue } }}
        />
      </div>
    </Modal>
  );
};
