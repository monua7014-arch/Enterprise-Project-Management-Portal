import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService, ReportingService } from '../../services';
import { IProjectItem, ProjectStatus, PriorityLevel } from '../../models';
import { ProjectModal } from './ProjectModal';
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

export const ProjectList: React.FC = () => {
  const { 
    config, 
    themeStyles, 
    setActiveView, 
    setSelectedProjectId, 
    refreshTrigger, 
    triggerRefresh, 
    showToast,
    globalSearch 
  } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof IProjectItem>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<IProjectItem | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<IProjectItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadProjects();
  }, [config, refreshTrigger]);

  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const pList = await ProjectService.getInstance().getProjects(config);
      setProjects(pList);
    } catch (err) {
      console.error('[ProjectList] Error fetching projects:', err);
      showToast('Error loading projects from SharePoint.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (projectData: Partial<IProjectItem>) => {
    const service = ProjectService.getInstance();
    if (editingProject) {
      await service.updateProject(editingProject.id, projectData, config);
      showToast(`Project '${projectData.title}' updated successfully.`, 'success');
    } else {
      await service.createProject(projectData as Omit<IProjectItem, 'id'>, config);
      showToast(`New project '${projectData.title}' created in SharePoint.`, 'success');
    }
    triggerRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await ProjectService.getInstance().deleteProject(projectToDelete.id, config);
      showToast(`Project '${projectToDelete.title}' deleted.`, 'success');
      setProjectToDelete(null);
      triggerRefresh();
    } catch (err) {
      showToast('Failed to delete project.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Status & Priority Colors
  const getStatusBadge = (status: ProjectStatus) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      Active: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
      Completed: { bg: 'rgba(0, 168, 232, 0.15)', text: '#00a8e8' },
      Delayed: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
      Planning: { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
      'On Hold': { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6' },
      Cancelled: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' }
    };
    const c = colors[status] || colors.Planning;
    return (
      <span
        style={{
          padding: '4px 9px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 700,
          backgroundColor: c.bg,
          color: c.text,
          display: 'inline-block'
        }}
      >
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    const colors: { [key: string]: string } = {
      Critical: '#ef4444',
      High: '#f97316',
      Medium: '#f59e0b',
      Low: '#10b981'
    };
    const col = colors[priority] || '#f59e0b';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: themeStyles.textPrimary }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: col }} />
        {priority}
      </span>
    );
  };

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchPriority = priorityFilter === 'All' || p.priority === priorityFilter;

      return matchSearch && matchStatus && matchPriority;
    }).sort((a, b) => {
      let vA: any = a[sortField];
      let vB: any = b[sortField];
      if (typeof vA === 'string') vA = vA.toLowerCase();
      if (typeof vB === 'string') vB = vB.toLowerCase();
      if (vA < vB) return sortAsc ? -1 : 1;
      if (vA > vB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [projects, searchQuery, statusFilter, priorityFilter, sortField, sortAsc]);

  // Paginated Slices
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const toggleSort = (field: keyof IProjectItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Action Bar */}
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
          <div style={{ width: '240px' }}>
            <SearchBox
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(_, val) => {
                setSearchQuery(val || '');
                setCurrentPage(1);
              }}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Dropdown
              selectedKey={statusFilter}
              options={[
                { key: 'All', text: 'All Statuses' },
                { key: 'Active', text: 'Active' },
                { key: 'Completed', text: 'Completed' },
                { key: 'Delayed', text: 'Delayed' },
                { key: 'Planning', text: 'Planning' },
                { key: 'On Hold', text: 'On Hold' }
              ]}
              onChange={(_, opt) => {
                if (opt) {
                  setStatusFilter(String(opt.key));
                  setCurrentPage(1);
                }
              }}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>

          <div style={{ width: '150px' }}>
            <Dropdown
              selectedKey={priorityFilter}
              options={[
                { key: 'All', text: 'All Priorities' },
                { key: 'Critical', text: 'Critical' },
                { key: 'High', text: 'High' },
                { key: 'Medium', text: 'Medium' },
                { key: 'Low', text: 'Low' }
              ]}
              onChange={(_, opt) => {
                if (opt) {
                  setPriorityFilter(String(opt.key));
                  setCurrentPage(1);
                }
              }}
              styles={{ root: { borderRadius: '6px' } }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Export to Excel"
            iconProps={{ iconName: 'ExcelLogo' }}
            onClick={() => ReportingService.getInstance().exportProjectsToExcel(filteredProjects)}
            styles={{ root: { borderRadius: '6px' } }}
          />
          <PrimaryButton
            text="New Project"
            iconProps={{ iconName: 'Add' }}
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
          />
        </div>
      </div>

      {/* Projects Table */}
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
            <Spinner size={SpinnerSize.large} label="Loading projects from SharePoint..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: themeStyles.textMuted }}>
            <i className="ms-Icon ms-Icon--ProjectDocument" style={{ fontSize: '36px', marginBottom: '12px', display: 'block' }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>No projects found</div>
            <div style={{ fontSize: '13px' }}>Try adjusting your search criteria or create a new project.</div>
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
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSort('projectId')}>
                    Project ID {sortField === 'projectId' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSort('title')}>
                    Project Title {sortField === 'title' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '12px 16px' }}>Client</th>
                  <th style={{ padding: '12px 16px' }}>Project Manager</th>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSort('budget')}>
                    Budget {sortField === 'budget' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '12px 16px' }}>Priority</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSort('progress')}>
                    Progress {sortField === 'progress' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: `1px solid ${themeStyles.border}`,
                      backgroundColor: idx % 2 === 0 ? 'transparent' : `${themeStyles.bgCardHover}55`,
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: themeStyles.accentBlue }}>
                      {p.projectId}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textPrimary }}>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setActiveView('project-detail');
                        }}
                      >
                        {p.title}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                      {p.clientName}
                    </td>
                    <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                      {p.projectManager?.title || 'Unassigned'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textPrimary }}>
                      ${p.budget.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getPriorityBadge(p.priority)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(p.status)}
                    </td>
                    <td style={{ padding: '14px 16px', width: '120px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                        <span style={{ color: themeStyles.textSecondary }}>{p.progress}%</span>
                      </div>
                      <ProgressIndicator
                        percentComplete={p.progress / 100}
                        styles={{ progressBar: { backgroundColor: themeStyles.accentBlue } }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <IconButton
                        iconProps={{ iconName: 'View' }}
                        title="View Details"
                        ariaLabel="View Details"
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setActiveView('project-detail');
                        }}
                        styles={{ root: { color: themeStyles.accentBlue } }}
                      />
                      <IconButton
                        iconProps={{ iconName: 'Edit' }}
                        title="Edit Project"
                        ariaLabel="Edit Project"
                        onClick={() => {
                          setEditingProject(p);
                          setIsModalOpen(true);
                        }}
                        styles={{ root: { color: themeStyles.textSecondary } }}
                      />
                      <IconButton
                        iconProps={{ iconName: 'Delete' }}
                        title="Delete Project"
                        ariaLabel="Delete Project"
                        onClick={() => setProjectToDelete(p)}
                        styles={{ root: { color: themeStyles.accentRed } }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProjects.length > pageSize && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 20px',
              borderTop: `1px solid ${themeStyles.border}`,
              backgroundColor: themeStyles.bgCardHover,
              fontSize: '13px',
              color: themeStyles.textSecondary
            }}
          >
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredProjects.length)} of {filteredProjects.length} projects
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DefaultButton
                text="Previous"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                styles={{ root: { minWidth: '70px', height: '30px' } }}
              />
              <span style={{ fontWeight: 600, color: themeStyles.textPrimary }}>
                Page {currentPage} of {totalPages}
              </span>
              <DefaultButton
                text="Next"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                styles={{ root: { minWidth: '70px', height: '30px' } }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Edit / Create Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        projectToEdit={editingProject}
        onDismiss={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        hidden={!projectToDelete}
        onDismiss={() => setProjectToDelete(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirm Project Deletion',
          subText: `Are you sure you want to delete '${projectToDelete?.title}' (${projectToDelete?.projectId})? This action will remove the record from SharePoint.`
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton
            text={deleting ? 'Deleting...' : 'Delete Project'}
            onClick={handleDeleteConfirm}
            disabled={deleting}
            styles={{ root: { backgroundColor: themeStyles.accentRed, borderColor: themeStyles.accentRed } }}
          />
          <DefaultButton text="Cancel" onClick={() => setProjectToDelete(null)} disabled={deleting} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};
