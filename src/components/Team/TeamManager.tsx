import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService } from '../../services';
import { ITeamMemberItem, IProjectItem, TeamRole } from '../../models';
import { INITIAL_TEAM_MEMBERS } from '../../services/MockData';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  SearchBox, 
  Dropdown, 
  IDropdownOption, 
  Modal, 
  TextField, 
  Slider, 
  Persona, 
  PersonaSize 
} from '@fluentui/react';

export const TeamManager: React.FC = () => {
  const { config, themeStyles, currentTheme, refreshTrigger, showToast, globalSearch } = useApp();
  const isDark = currentTheme === 'dark';

  const [loading, setLoading] = useState<boolean>(true);
  const [teamMembers, setTeamMembers] = useState<ITeamMemberItem[]>([...INITIAL_TEAM_MEMBERS]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberEmail, setNewMemberEmail] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('Senior Developer');
  const [newMemberProjectId, setNewMemberProjectId] = useState<number>(0);
  const [newMemberAllocation, setNewMemberAllocation] = useState<number>(100);

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
      const pList = await ProjectService.getInstance().getProjects(config);
      setProjects(pList);
      if (pList.length > 0) setNewMemberProjectId(pList[0].id);
    } catch (err) {
      console.error('[TeamManager] Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignMember = () => {
    if (!newMemberName.trim() || !newMemberProjectId) return;
    const newEntry: ITeamMemberItem = {
      id: Date.now(),
      projectId: newMemberProjectId,
      user: {
        id: Date.now(),
        title: newMemberName,
        email: newMemberEmail || `${newMemberName.toLowerCase().replace(/\s+/g, '.')}@tenant.com`
      },
      role: newMemberRole,
      allocationPercentage: newMemberAllocation,
      assignedDate: new Date().toISOString()
    };

    setTeamMembers(prev => [newEntry, ...prev]);
    showToast(`Assigned ${newMemberName} to project.`, 'success');
    setIsModalOpen(false);
    setNewMemberName('');
    setNewMemberEmail('');
  };

  const handleRemoveMember = (id: number) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showToast('Team member unassigned.', 'info');
  };

  const roleOptions: IDropdownOption[] = [
    { key: 'All', text: 'All Roles' },
    { key: 'Project Manager', text: 'Project Manager' },
    { key: 'Technical Lead', text: 'Technical Lead' },
    { key: 'Senior Developer', text: 'Senior Developer' },
    { key: 'Frontend Developer', text: 'Frontend Developer' },
    { key: 'Backend Developer', text: 'Backend Developer' },
    { key: 'QA Engineer', text: 'QA Engineer' },
    { key: 'DevOps Engineer', text: 'DevOps Engineer' },
    { key: 'Business Analyst', text: 'Business Analyst' }
  ];

  // Aggregated Member Utilization (combines multi-project allocations)
  const memberWorkloads = useMemo(() => {
    const map = new Map<string, { member: ITeamMemberItem; totalAlloc: number; projects: string[] }>();
    for (const tm of teamMembers) {
      const p = projects.find(prj => prj.id === tm.projectId);
      const email = tm.user.email;
      if (!map.has(email)) {
        map.set(email, { member: tm, totalAlloc: tm.allocationPercentage, projects: [p?.title || 'Core Project'] });
      } else {
        const existing = map.get(email)!;
        existing.totalAlloc += tm.allocationPercentage;
        if (p?.title && !existing.projects.includes(p.title)) {
          existing.projects.push(p.title);
        }
      }
    }
    return Array.from(map.values());
  }, [teamMembers, projects]);

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const matchesSearch = !searchQuery || m.user.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProject = projectFilter === 'All' || String(m.projectId) === projectFilter;
      const matchesRole = roleFilter === 'All' || m.role === roleFilter;
      return matchesSearch && matchesProject && matchesRole;
    });
  }, [teamMembers, searchQuery, projectFilter, roleFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Top Banner */}
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
            Team Capacity & Workload Allocation
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            Resource management, FTE utilization meters, and overallocation alerts
          </div>
        </div>

        <PrimaryButton
          text="Assign Team Member"
          iconProps={{ iconName: 'AddFriend' }}
          onClick={() => setIsModalOpen(true)}
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

      {/* Aggregate Resource Workload Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}
      >
        {memberWorkloads.map(({ member, totalAlloc, projects: prjs }) => {
          const isOverAllocated = totalAlloc > 100;

          return (
            <div
              key={member.user.email}
              style={{
                padding: '18px',
                borderRadius: '12px',
                backgroundColor: themeStyles.bgCard,
                border: `1px solid ${isOverAllocated ? 'rgba(244,63,94,0.4)' : themeStyles.border}`,
                boxShadow: themeStyles.cardShadow,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Persona
                  text={member.user.title}
                  secondaryText={member.role}
                  size={PersonaSize.size32}
                  styles={{
                    primaryText: { color: themeStyles.textPrimary, fontWeight: 700 },
                    secondaryText: { color: themeStyles.textSecondary }
                  }}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isOverAllocated ? '#f43f5e' : totalAlloc === 100 ? '#10b981' : themeStyles.accentBlue,
                    backgroundColor: isOverAllocated ? 'rgba(244,63,94,0.12)' : 'rgba(14,165,233,0.12)',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  {totalAlloc}% FTE
                </span>
              </div>

              {/* Allocation Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span style={{ color: themeStyles.textMuted }}>Workload Utilization</span>
                  <span style={{ fontWeight: 700, color: isOverAllocated ? '#f43f5e' : themeStyles.textPrimary }}>
                    {isOverAllocated ? 'OVERALLOCATED' : `${100 - totalAlloc}% Available`}
                  </span>
                </div>
                <div style={{ width: '100%', height: '7px', borderRadius: '4px', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(totalAlloc, 100)}%`,
                      height: '100%',
                      backgroundColor: isOverAllocated ? '#f43f5e' : totalAlloc === 100 ? '#10b981' : themeStyles.accentBlue,
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>

              <div style={{ fontSize: '11px', color: themeStyles.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Assigned: {prjs.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Toolbar & Assignment Register */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeStyles.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Project Allocations Register ({filteredMembers.length})
          </h3>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '160px' }}>
              <Dropdown
                selectedKey={roleFilter}
                onChange={(_, opt) => opt && setRoleFilter(opt.key as string)}
                options={roleOptions}
                styles={{
                  title: {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderColor: themeStyles.border,
                    borderRadius: '8px',
                    height: '32px',
                    lineHeight: '30px',
                    fontSize: '11.5px',
                    color: themeStyles.textPrimary
                  }
                }}
              />
            </div>
            <div style={{ width: '200px' }}>
              <SearchBox
                placeholder="Search member..."
                value={searchQuery}
                onChange={(_, val) => setSearchQuery(val || '')}
                styles={{
                  root: {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderRadius: '8px',
                    border: `1px solid ${themeStyles.border}`,
                    height: '32px'
                  },
                  field: { fontSize: '11.5px', color: themeStyles.textPrimary }
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary, textTransform: 'uppercase', fontSize: '10.5px' }}>
                <th style={{ padding: '12px 18px' }}>Team Member</th>
                <th style={{ padding: '12px 14px' }}>Role</th>
                <th style={{ padding: '12px 14px' }}>Project Allocation</th>
                <th style={{ padding: '12px 14px' }}>Assigned %</th>
                <th style={{ padding: '12px 14px' }}>Assigned Date</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => {
                const project = projects.find(p => p.id === m.projectId);

                return (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${themeStyles.borderLight}` }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: themeStyles.textPrimary }}>
                      {m.user.title}
                      <div style={{ fontSize: '10.5px', color: themeStyles.textSecondary, fontWeight: 400 }}>{m.user.email}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: themeStyles.accentBlue, fontWeight: 600 }}>
                      {m.role}
                    </td>
                    <td style={{ padding: '12px 14px', color: themeStyles.textPrimary }}>
                      {project?.title || 'Core Project'}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800 }}>
                      {m.allocationPercentage}%
                    </td>
                    <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>
                      {new Date(m.assignedDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <IconButton
                        iconProps={{ iconName: 'Delete' }}
                        title="Unassign"
                        onClick={() => handleRemoveMember(m.id)}
                        styles={{ root: { color: themeStyles.textSecondary, ':hover': { color: '#f43f5e' } } }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Assigning Member */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onDismiss={() => setIsModalOpen(false)}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, borderRadius: '12px', padding: '24px', width: '450px', color: themeStyles.textPrimary }
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Assign Team Member</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <TextField label="Full Name" value={newMemberName} onChange={(_, val) => setNewMemberName(val || '')} required />
            <TextField label="Corporate Email" value={newMemberEmail} onChange={(_, val) => setNewMemberEmail(val || '')} />
            <Dropdown
              label="Role"
              selectedKey={newMemberRole}
              options={roleOptions.filter(o => o.key !== 'All')}
              onChange={(_, opt) => opt && setNewMemberRole(opt.key as TeamRole)}
            />
            <Dropdown
              label="Project"
              selectedKey={newMemberProjectId}
              options={projects.map(p => ({ key: p.id, text: p.title }))}
              onChange={(_, opt) => opt && setNewMemberProjectId(Number(opt.key))}
            />
            <Slider
              label={`FTE Allocation: ${newMemberAllocation}%`}
              min={10}
              max={100}
              step={5}
              value={newMemberAllocation}
              onChange={val => setNewMemberAllocation(val)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <DefaultButton text="Cancel" onClick={() => setIsModalOpen(false)} />
            <PrimaryButton text="Assign Member" onClick={handleAssignMember} styles={{ root: { backgroundColor: themeStyles.accentBlue } }} />
          </div>
        </Modal>
      )}
    </div>
  );
};
