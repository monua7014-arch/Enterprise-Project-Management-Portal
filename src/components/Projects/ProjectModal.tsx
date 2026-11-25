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
import { IProjectItem, ProjectStatus, PriorityLevel } from '../../models';
import { useApp } from '../../context/AppContext';

interface IProjectModalProps {
  isOpen: boolean;
  projectToEdit?: IProjectItem | null;
  onDismiss: () => void;
  onSave: (project: Partial<IProjectItem>) => Promise<void>;
}

export const ProjectModal: React.FC<IProjectModalProps> = ({
  isOpen,
  projectToEdit,
  onDismiss,
  onSave
}) => {
  const { themeStyles } = useApp();
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    clientName: '',
    pmTitle: '',
    pmEmail: '',
    startDate: '',
    endDate: '',
    budget: 0,
    status: 'Planning' as ProjectStatus,
    priority: 'Medium' as PriorityLevel,
    progress: 0
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        projectId: projectToEdit.projectId || '',
        title: projectToEdit.title || '',
        description: projectToEdit.description || '',
        clientName: projectToEdit.clientName || '',
        pmTitle: projectToEdit.projectManager?.title || '',
        pmEmail: projectToEdit.projectManager?.email || '',
        startDate: projectToEdit.startDate ? projectToEdit.startDate.split('T')[0] : '',
        endDate: projectToEdit.endDate ? projectToEdit.endDate.split('T')[0] : '',
        budget: projectToEdit.budget || 0,
        status: projectToEdit.status || 'Planning',
        priority: projectToEdit.priority || 'Medium',
        progress: projectToEdit.progress || 0
      });
    } else {
      const generatedId = `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const today = new Date().toISOString().split('T')[0];
      const future = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
      setFormData({
        projectId: generatedId,
        title: '',
        description: '',
        clientName: '',
        pmTitle: '',
        pmEmail: '',
        startDate: today,
        endDate: future,
        budget: 50000,
        status: 'Planning',
        priority: 'Medium',
        progress: 0
      });
    }
    setErrorMessage('');
  }, [projectToEdit, isOpen]);

  const statusOptions: IDropdownOption[] = [
    { key: 'Planning', text: 'Planning' },
    { key: 'Active', text: 'Active' },
    { key: 'On Hold', text: 'On Hold' },
    { key: 'Delayed', text: 'Delayed' },
    { key: 'Completed', text: 'Completed' },
    { key: 'Cancelled', text: 'Cancelled' }
  ];

  const priorityOptions: IDropdownOption[] = [
    { key: 'Low', text: 'Low' },
    { key: 'Medium', text: 'Medium' },
    { key: 'High', text: 'High' },
    { key: 'Critical', text: 'Critical' }
  ];

  const handleSubmit = async () => {
    if (!formData.projectId.trim()) {
      setErrorMessage('Project ID is required.');
      return;
    }
    if (!formData.title.trim()) {
      setErrorMessage('Project Title is required.');
      return;
    }
    if (!formData.clientName.trim()) {
      setErrorMessage('Client Name is required.');
      return;
    }
    if (formData.budget < 0) {
      setErrorMessage('Budget must be greater than or equal to 0.');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    try {
      await onSave({
        projectId: formData.projectId,
        title: formData.title,
        description: formData.description,
        clientName: formData.clientName,
        projectManager: formData.pmTitle ? {
          id: projectToEdit?.projectManager?.id || 0,
          title: formData.pmTitle,
          email: formData.pmEmail
        } : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date().toISOString(),
        budget: Number(formData.budget),
        status: formData.status,
        priority: formData.priority,
        progress: Number(formData.progress),
        assignedTeam: projectToEdit?.assignedTeam || []
      });
      onDismiss();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving project to SharePoint.');
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
          width: '680px',
          maxWidth: '90vw',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          overflow: 'hidden'
        }
      }}
    >
      {/* Header */}
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
          {projectToEdit ? 'Edit Project' : 'Create New Enterprise Project'}
        </h2>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          ariaLabel="Close popup"
          onClick={onDismiss}
          styles={{ root: { color: themeStyles.textSecondary } }}
        />
      </div>

      {/* Body */}
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <TextField
            label="Project ID"
            required
            value={formData.projectId}
            onChange={(_, val) => setFormData(p => ({ ...p, projectId: val || '' }))}
          />
          <TextField
            label="Client / Account Name"
            required
            value={formData.clientName}
            onChange={(_, val) => setFormData(p => ({ ...p, clientName: val || '' }))}
          />
        </div>

        <div style={{ marginTop: '14px' }}>
          <TextField
            label="Project Title"
            required
            value={formData.title}
            onChange={(_, val) => setFormData(p => ({ ...p, title: val || '' }))}
          />
        </div>

        <div style={{ marginTop: '14px' }}>
          <TextField
            label="Description & Scope"
            multiline
            rows={3}
            value={formData.description}
            onChange={(_, val) => setFormData(p => ({ ...p, description: val || '' }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
          <TextField
            label="Project Manager Name"
            value={formData.pmTitle}
            onChange={(_, val) => setFormData(p => ({ ...p, pmTitle: val || '' }))}
          />
          <TextField
            label="Project Manager Email"
            value={formData.pmEmail}
            onChange={(_, val) => setFormData(p => ({ ...p, pmEmail: val || '' }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '14px' }}>
          <TextField
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(_, val) => setFormData(p => ({ ...p, startDate: val || '' }))}
          />
          <TextField
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(_, val) => setFormData(p => ({ ...p, endDate: val || '' }))}
          />
          <TextField
            label="Budget ($ USD)"
            type="number"
            value={String(formData.budget)}
            onChange={(_, val) => setFormData(p => ({ ...p, budget: Number(val) || 0 }))}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '14px' }}>
          <Dropdown
            label="Project Status"
            selectedKey={formData.status}
            options={statusOptions}
            onChange={(_, opt) => opt && setFormData(p => ({ ...p, status: opt.key as ProjectStatus }))}
          />
          <Dropdown
            label="Priority Level"
            selectedKey={formData.priority}
            options={priorityOptions}
            onChange={(_, opt) => opt && setFormData(p => ({ ...p, priority: opt.key as PriorityLevel }))}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Slider
            label={`Delivery Progress: ${formData.progress}%`}
            min={0}
            max={100}
            step={5}
            value={formData.progress}
            onChange={val => setFormData(p => ({ ...p, progress: val }))}
          />
        </div>
      </div>

      {/* Footer */}
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
          text={saving ? 'Saving to SharePoint...' : projectToEdit ? 'Update Project' : 'Create Project'}
          onClick={handleSubmit}
          disabled={saving}
          styles={{ root: { backgroundColor: themeStyles.accentBlue } }}
        />
      </div>
    </Modal>
  );
};
