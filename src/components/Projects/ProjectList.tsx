import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService, ReportingService } from '../../services';
import { IProjectItem, ProjectStatus, PriorityLevel } from '../../models';
import { ProjectModal } from './ProjectModal';
import { getStatusBadgeStyle } from '../../styles/theme';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  SearchBox, 
  Dropdown, 
  IDropdownOption, 
  Dialog, 
  DialogType, 
  DialogFooter, 
  Spinner, 
  SpinnerSize,
  Panel,
  PanelType
} from '@fluentui/react';

export const ProjectList: React.FC = () => {
  const { 
    config, 
    themeStyles, 
    currentTheme,
    setActiveView, 
    setSelectedProjectId, 
    refreshTrigger, 
    triggerRefresh, 
    showToast,
    globalSearch,
    portfolioFilter,
    setPortfolioFilter
  } = useApp();

  const isDark = currentTheme === 'dark';

  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof IProjectItem>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  
  // Pagination & Page Size
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  // Modal, Drawer & Dialog state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<IProjectItem | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<IProjectItem | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [drawerProject, setDrawerProject] = useState<IProjectItem | null>(null);

  useEffect(() => {
    loadProjects();
  }, [config, refreshTrigger]);

  useEffect(() => {
    if (globalSearch) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  // Apply filter from KPI card click
  useEffect(() => {
    if (portfolioFilter?.status) {
      setStatusFilter(portfolioFilter.status);
    }
    if (portfolioFilter?.priority) {
      setPriorityFilter(portfolioFilter.priority);
    }
  }, [portfolioFilter]);

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

  const handleExportExcel = () => {
    ReportingService.getInstance().exportProjectsToExcel(projects);
    showToast('Exported project portfolio to Excel.', 'success');
  };

  // Sorting Handler
  const handleSort = (field: keyof IProjectItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Filter & Sort Pipeline
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesSearch = 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.projectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
        const matchesPriority = priorityFilter === 'All' || p.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return 0;
      });
  }, [projects, searchQuery, statusFilter, priorityFilter, sortField, sortAsc]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Banner & Primary Actions */}
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
            Project Portfolio Repository
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            {filteredProjects.length} projects matched • Real-time synchronization with SharePoint List
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <DefaultButton
            text="Export to Excel"
            iconProps={{ iconName: 'ExcelLogo' }}
            onClick={handleExportExcel}
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
            text="New Project"
            iconProps={{ iconName: 'Add' }}
            onClick={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            styles={{
              root: {
                borderRadius: '8px',
                height: '36px',
                backgroundColor: themeStyles.accentBlue,
                border: 'none',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
              }
            }}
          />
        </div>
      </div>

      {/* Filter Toolbar (Search, Status, Priority, Reset) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '14px 20px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '10px'
        }}
      >
        <div style={{ flex: 1, minWidth: '220px' }}>
          <SearchBox
            placeholder="Search by ID, name or client..."
            value={searchQuery}
            onChange={(_, val) => setSearchQuery(val || '')}
            onClear={() => setSearchQuery('')}
            underlined={false}
            styles={{
              root: {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                borderRadius: '8px',
                border: `1px solid ${themeStyles.border}`,
                height: '34px'
              },
              field: { fontSize: '12px', color: themeStyles.textPrimary }
            }}
          />
        </div>

        <div style={{ width: '150px' }}>
          <Dropdown
            selectedKey={statusFilter}
            onChange={(_, opt) => opt && setStatusFilter(opt.key as string)}
            options={[
              { key: 'All', text: 'All Statuses' },
              { key: 'Active', text: 'Active' },
              { key: 'Planning', text: 'Planning' },
              { key: 'Delayed', text: 'Delayed' },
              { key: 'Completed', text: 'Completed' },
              { key: 'On Hold', text: 'On Hold' }
            ]}
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

        <div style={{ width: '140px' }}>
          <Dropdown
            selectedKey={priorityFilter}
            onChange={(_, opt) => opt && setPriorityFilter(opt.key as string)}
            options={[
              { key: 'All', text: 'All Priorities' },
              { key: 'Critical', text: 'Critical' },
              { key: 'High', text: 'High' },
              { key: 'Medium', text: 'Medium' },
              { key: 'Low', text: 'Low' }
            ]}
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

        {(statusFilter !== 'All' || priorityFilter !== 'All' || searchQuery !== '') && (
          <DefaultButton
            text="Reset Filters"
            iconProps={{ iconName: 'ClearFilter' }}
            onClick={() => {
              setStatusFilter('All');
              setPriorityFilter('All');
              setSearchQuery('');
              setPortfolioFilter(null);
            }}
            styles={{
              root: {
                height: '34px',
                borderRadius: '8px',
                fontSize: '11.5px',
                borderColor: themeStyles.border
              }
            }}
          />
        )}
      </div>

      {/* Enterprise Data Table */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: themeStyles.cardShadow
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Loading portfolio records..." />
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: themeStyles.textSecondary }}>
            <i className="ms-Icon ms-Icon--SearchIssue" style={{ fontSize: '32px', color: themeStyles.textMuted }} />
            <div style={{ marginTop: '12px', fontWeight: 600 }}>No projects matching current criteria.</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Try resetting your search query or filters.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                    borderBottom: `1px solid ${themeStyles.border}`,
                    color: themeStyles.textSecondary,
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  <th style={{ padding: '14px 20px', cursor: 'pointer' }} onClick={() => handleSort('projectId')}>
                    Project ID {sortField === 'projectId' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 20px', cursor: 'pointer' }} onClick={() => handleSort('title')}>
                    Project Name & Client {sortField === 'title' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                    Status {sortField === 'status' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => handleSort('priority')}>
                    Priority {sortField === 'priority' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => handleSort('progress')}>
                    Progress {sortField === 'progress' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => handleSort('budget')}>
                    Budget {sortField === 'budget' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: `1px solid ${themeStyles.border}`,
                      backgroundColor: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.015)' : '#fafafa',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.015)' : '#fafafa'}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: themeStyles.accentBlue }}>
                      {p.projectId}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div 
                        onClick={() => {
                          setSelectedProjectId(p.id);
                          setActiveView('project-detail');
                        }}
                        style={{ fontWeight: 700, color: themeStyles.textPrimary, cursor: 'pointer' }}
                      >
                        {p.title}
                      </div>
                      <div style={{ fontSize: '11px', color: themeStyles.textSecondary, marginTop: '2px' }}>
                        {p.clientName} • PM: {p.projectManager?.title || 'Unassigned'}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={getStatusBadgeStyle(p.status, isDark)}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={getStatusBadgeStyle(p.priority, isDark)}>
                        {p.priority}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', minWidth: '130px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <span style={{ color: themeStyles.textSecondary }}>{p.progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${p.progress}%`,
                            height: '100%',
                            backgroundColor: p.progress === 100 ? '#10b981' : p.status === 'Delayed' ? '#f43f5e' : '#0ea5e9',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: themeStyles.textPrimary }}>
                      ${p.budget.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <IconButton
                          iconProps={{ iconName: 'QuickNote' }}
                          title="Quick View Details Drawer"
                          onClick={() => setDrawerProject(p)}
                          styles={{ root: { color: themeStyles.textSecondary, ':hover': { color: themeStyles.textPrimary } } }}
                        />
                        <IconButton
                          iconProps={{ iconName: 'Edit' }}
                          title="Edit Project"
                          onClick={() => {
                            setEditingProject(p);
                            setIsModalOpen(true);
                          }}
                          styles={{ root: { color: themeStyles.textSecondary, ':hover': { color: themeStyles.accentBlue } } }}
                        />
                        <IconButton
                          iconProps={{ iconName: 'Delete' }}
                          title="Delete Project"
                          onClick={() => setProjectToDelete(p)}
                          styles={{ root: { color: themeStyles.textSecondary, ':hover': { color: '#f43f5e' } } }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Page-Size Controls */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${themeStyles.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: themeStyles.textSecondary }}>
            <span>Rows per page:</span>
            {[5, 10, 20].map(sz => (
              <span
                key={sz}
                onClick={() => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                style={{
                  cursor: 'pointer',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: pageSize === sz ? themeStyles.accentBlue : 'transparent',
                  color: pageSize === sz ? '#fff' : themeStyles.textSecondary,
                  fontWeight: pageSize === sz ? 700 : 500
                }}
              >
                {sz}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11.5px', color: themeStyles.textSecondary }}>
              Page {currentPage} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <IconButton
                iconProps={{ iconName: 'ChevronLeft' }}
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                styles={{ root: { color: themeStyles.textSecondary } }}
              />
              <IconButton
                iconProps={{ iconName: 'ChevronRight' }}
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                styles={{ root: { color: themeStyles.textSecondary } }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project Details Slide-over Drawer */}
      {drawerProject && (
        <Panel
          isOpen={true}
          onDismiss={() => setDrawerProject(null)}
          type={PanelType.medium}
          headerText="Project Specifications & Health"
          closeButtonAriaLabel="Close"
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, color: themeStyles.textPrimary },
            headerText: { color: themeStyles.textPrimary, fontWeight: 700 }
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: themeStyles.accentBlue }}>
                {drawerProject.projectId}
              </span>
              <span style={getStatusBadgeStyle(drawerProject.status, isDark)}>
                {drawerProject.status}
              </span>
            </div>

            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: themeStyles.textPrimary }}>
              {drawerProject.title}
            </h3>

            <p style={{ margin: 0, fontSize: '12.5px', color: themeStyles.textSecondary, lineHeight: 1.5 }}>
              {drawerProject.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '16px', borderRadius: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1px solid ${themeStyles.border}` }}>
              <div>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Client</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>{drawerProject.clientName}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Project Manager</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>{drawerProject.projectManager?.title || 'Unassigned'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Total Budget</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>${drawerProject.budget.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Actual Spend</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>${(drawerProject.actualSpend || 0).toLocaleString()}</div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: themeStyles.textSecondary }}>Delivery Completion</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: themeStyles.accentBlue }}>{drawerProject.progress}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', overflow: 'hidden' }}>
                <div style={{ width: `${drawerProject.progress}%`, height: '100%', backgroundColor: themeStyles.accentBlue, borderRadius: '4px' }} />
              </div>
            </div>

            <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
              <PrimaryButton
                text="Open Full Project Workstream"
                iconProps={{ iconName: 'NavigateExternalInline' }}
                onClick={() => {
                  setSelectedProjectId(drawerProject.id);
                  setActiveView('project-detail');
                  setDrawerProject(null);
                }}
                styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '8px' } }}
              />
            </div>
          </div>
        </Panel>
      )}

      {/* Project Create / Edit Modal */}
      {isModalOpen && (
        <ProjectModal
          isOpen={isModalOpen}
          projectToEdit={editingProject}
          onDismiss={() => setIsModalOpen(false)}
          onSave={handleSaveProject}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        hidden={!projectToDelete}
        onDismiss={() => setProjectToDelete(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirm Project Deletion',
          subText: `Are you sure you want to delete '${projectToDelete?.title}'? This action cannot be undone.`
        }}
        styles={{
          main: { backgroundColor: themeStyles.bgCardElevated, color: themeStyles.textPrimary }
        }}
      >
        <DialogFooter>
          <PrimaryButton
            text={deleting ? 'Deleting...' : 'Delete Permanently'}
            disabled={deleting}
            onClick={handleDeleteConfirm}
            styles={{ root: { backgroundColor: '#f43f5e', borderColor: '#f43f5e' } }}
          />
          <DefaultButton text="Cancel" onClick={() => setProjectToDelete(null)} />
        </DialogFooter>
      </Dialog>
    </div>
  );
};
