import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ProjectService, 
  TaskService, 
  DocumentService 
} from '../../services';
import { 
  IProjectItem, 
  IMilestoneItem, 
  ITaskItem, 
  IDocumentItem,
  IActivityLogItem 
} from '../../models';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  TextField, 
  ProgressIndicator, 
  Spinner, 
  SpinnerSize, 
  Checkbox,
  Pivot,
  PivotItem
} from '@fluentui/react';

export const ProjectDetail: React.FC = () => {
  const { 
    selectedProjectId, 
    setActiveView, 
    config, 
    themeStyles, 
    showToast, 
    refreshTrigger, 
    triggerRefresh 
  } = useApp();

  const [project, setProject] = useState<IProjectItem | null>(null);
  const [milestones, setMilestones] = useState<IMilestoneItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [documents, setDocuments] = useState<IDocumentItem[]>([]);
  const [activities, setActivities] = useState<IActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Milestone Form State
  const [showAddMilestone, setShowAddMilestone] = useState<boolean>(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneDate, setNewMilestoneDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectData(selectedProjectId);
    }
  }, [selectedProjectId, config, refreshTrigger]);

  const loadProjectData = async (id: number) => {
    setLoading(true);
    try {
      const pService = ProjectService.getInstance();
      const tService = TaskService.getInstance();
      const dService = DocumentService.getInstance();

      const [p, mList, tList, dList] = await Promise.all([
        pService.getProjectById(id, config),
        pService.getMilestones(id, config),
        tService.getTasks(config, id),
        dService.getDocuments(config, id)
      ]);

      setProject(p);
      setMilestones(mList);
      setTasks(tList);
      setDocuments(dList);
      setActivities(pService.getActivities(id));
    } catch (err) {
      console.error('[ProjectDetail] Error loading detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMilestone = async (m: IMilestoneItem) => {
    const newStatus = m.status === 'Completed' ? 'In Progress' : 'Completed';
    await ProjectService.getInstance().updateMilestone(
      m.id,
      {
        status: newStatus,
        completedDate: newStatus === 'Completed' ? new Date().toISOString() : undefined
      },
      config
    );
    showToast(`Milestone marked as ${newStatus}.`, 'success');
    triggerRefresh();
  };

  const handleAddMilestone = async () => {
    if (!newMilestoneTitle.trim() || !project) return;
    await ProjectService.getInstance().addMilestone(
      {
        projectId: project.id,
        title: newMilestoneTitle,
        dueDate: new Date(newMilestoneDate).toISOString(),
        status: 'In Progress'
      },
      config
    );
    setNewMilestoneTitle('');
    setShowAddMilestone(false);
    showToast('New milestone added.', 'success');
    triggerRefresh();
  };

  const handleDeleteMilestone = async (id: number) => {
    await ProjectService.getInstance().deleteMilestone(id, config);
    showToast('Milestone deleted.', 'info');
    triggerRefresh();
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spinner size={SpinnerSize.large} label="Loading project details from SharePoint..." />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No project selected</h3>
        <DefaultButton text="Back to Projects" onClick={() => setActiveView('projects')} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <DefaultButton
          text="Back to Projects"
          iconProps={{ iconName: 'Back' }}
          onClick={() => setActiveView('projects')}
          styles={{ root: { borderRadius: '6px' } }}
        />
        <span style={{ color: themeStyles.textMuted }}>/</span>
        <span style={{ fontSize: '13px', color: themeStyles.accentBlue, fontWeight: 700 }}>
          {project.projectId}
        </span>
      </div>

      {/* Hero Overview Card */}
      <div
        style={{
          padding: '24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 168, 232, 0.15)',
                  color: themeStyles.accentBlue,
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                {project.projectId}
              </span>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: themeStyles.textPrimary }}>
                {project.title}
              </h2>
            </div>
            <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '6px' }}>
              Client: <strong>{project.clientName}</strong> &nbsp;|&nbsp;
              Manager: <strong>{project.projectManager?.title || 'Unassigned'}</strong> &nbsp;|&nbsp;
              Budget: <strong>${project.budget.toLocaleString()}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: themeStyles.accentGreen,
                fontWeight: 700,
                fontSize: '12px'
              }}
            >
              {project.status}
            </span>
            <span
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: themeStyles.accentRed,
                fontWeight: 700,
                fontSize: '12px'
              }}
            >
              {project.priority} Priority
            </span>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '13.5px', color: themeStyles.textSecondary, lineHeight: 1.5 }}>
          {project.description}
        </p>

        {/* Progress Bar & Schedule Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: themeStyles.textSecondary }}>
            <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
            <span style={{ fontWeight: 700, color: themeStyles.accentBlue }}>{project.progress}% Complete</span>
            <span>Target End: {new Date(project.endDate).toLocaleDateString()}</span>
          </div>
          <ProgressIndicator
            percentComplete={project.progress / 100}
            styles={{ progressBar: { backgroundColor: themeStyles.accentBlue } }}
          />
        </div>
      </div>

      {/* Tabbed Sections: Milestones, Tasks, Documents, Activity */}
      <div
        style={{
          padding: '20px 24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <Pivot aria-label="Project Details Sections">
          {/* Section 1: Milestones */}
          <PivotItem headerText={`Milestones (${milestones.length})`}>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: themeStyles.textPrimary }}>
                  Project Milestones & Deliverables
                </h4>
                <PrimaryButton
                  text="Add Milestone"
                  iconProps={{ iconName: 'Add' }}
                  onClick={() => setShowAddMilestone(!showAddMilestone)}
                  styles={{ root: { borderRadius: '6px', backgroundColor: themeStyles.accentBlue } }}
                />
              </div>

              {showAddMilestone && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: themeStyles.bgCardHover,
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-end',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <TextField
                      label="Milestone Title"
                      value={newMilestoneTitle}
                      onChange={(_, val) => setNewMilestoneTitle(val || '')}
                    />
                  </div>
                  <div style={{ width: '180px' }}>
                    <TextField
                      label="Due Date"
                      type="date"
                      value={newMilestoneDate}
                      onChange={(_, val) => setNewMilestoneDate(val || '')}
                    />
                  </div>
                  <PrimaryButton text="Save" onClick={handleAddMilestone} />
                  <DefaultButton text="Cancel" onClick={() => setShowAddMilestone(false)} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {milestones.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted }}>
                    No milestones recorded yet for this project.
                  </div>
                ) : (
                  milestones.map(m => {
                    const isDone = m.status === 'Completed';
                    return (
                      <div
                        key={m.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: themeStyles.bgCardHover,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderLeft: isDone ? `4px solid ${themeStyles.accentGreen}` : `4px solid ${themeStyles.accentAmber}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Checkbox
                            checked={isDone}
                            onChange={() => handleToggleMilestone(m)}
                          />
                          <div>
                            <span
                              style={{
                                fontSize: '13.5px',
                                fontWeight: 600,
                                textDecoration: isDone ? 'line-through' : 'none',
                                color: isDone ? themeStyles.textMuted : themeStyles.textPrimary
                              }}
                            >
                              {m.title}
                            </span>
                            <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>
                              Due: {new Date(m.dueDate).toLocaleDateString()} &nbsp;|&nbsp;
                              Status: <strong style={{ color: isDone ? themeStyles.accentGreen : themeStyles.accentAmber }}>{m.status}</strong>
                            </div>
                          </div>
                        </div>

                        <IconButton
                          iconProps={{ iconName: 'Delete' }}
                          title="Delete Milestone"
                          onClick={() => handleDeleteMilestone(m.id)}
                          styles={{ root: { color: themeStyles.accentRed } }}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </PivotItem>

          {/* Section 2: Associated Tasks */}
          <PivotItem headerText={`Tasks (${tasks.length})`}>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: themeStyles.textPrimary }}>
                  Work Breakdown Tasks
                </h4>
                <DefaultButton
                  text="Go to Task Manager"
                  iconProps={{ iconName: 'TaskGroup' }}
                  onClick={() => setActiveView('tasks')}
                />
              </div>

              {tasks.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted }}>
                  No tasks assigned to this project yet.
                </div>
              ) : (
                tasks.map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.accentBlue }}>
                        {t.taskId}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: themeStyles.textPrimary, marginLeft: '8px' }}>
                        {t.title}
                      </span>
                      <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '2px' }}>
                        Assignee: {t.assignedTo?.title || 'Unassigned'} &nbsp;|&nbsp;
                        Due: {new Date(t.dueDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(0, 168, 232, 0.15)',
                          color: themeStyles.accentBlue
                        }}
                      >
                        {t.status}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: themeStyles.textPrimary }}>
                        {t.completionPercentage}%
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PivotItem>

          {/* Section 3: Documents */}
          <PivotItem headerText={`Documents (${documents.length})`}>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: themeStyles.textPrimary }}>
                  Linked SharePoint Library Documents
                </h4>
                <DefaultButton
                  text="Go to Documents Library"
                  iconProps={{ iconName: 'FabricFolder' }}
                  onClick={() => setActiveView('documents')}
                />
              </div>

              {documents.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted }}>
                  No documents linked to this project.
                </div>
              ) : (
                documents.map(d => (
                  <div
                    key={d.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="ms-Icon ms-Icon--Page" style={{ fontSize: '20px', color: themeStyles.accentBlue }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: themeStyles.textPrimary }}>
                          {d.name}
                        </div>
                        <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>
                          Category: {d.category} &nbsp;|&nbsp; Modified: {new Date(d.modified).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <a
                      href={d.serverRelativeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: themeStyles.accentBlue,
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Open Document
                    </a>
                  </div>
                ))
              )}
            </div>
          </PivotItem>

          {/* Section 4: Activity Log */}
          <PivotItem headerText="Activity History">
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activities.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted }}>
                  No activities logged yet for this project.
                </div>
              ) : (
                activities.map(a => (
                  <div
                    key={a.id}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '12.5px'
                    }}
                  >
                    <i className="ms-Icon ms-Icon--History" style={{ color: themeStyles.accentBlue }} />
                    <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>{a.action}:</span>
                    <span style={{ color: themeStyles.textSecondary }}>{a.details}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: themeStyles.textMuted }}>
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </PivotItem>
        </Pivot>
      </div>
    </div>
  );
};
