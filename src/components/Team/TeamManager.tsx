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
  PersonaSize, 
  ProgressIndicator, 
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

export const TeamManager: React.FC = () => {
  const { config, themeStyles, refreshTrigger, triggerRefresh, showToast, globalSearch } = useApp();

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

  const projectOptions: IDropdownOption[] = [
    { key: 'All', text: 'All Projects' },
    ...projects.map(p => ({ key: String(p.id), text: p.title }))
  ];

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const matchSearch =
        !searchQuery ||
        m.user.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchProject = projectFilter === 'All' || String(m.projectId) === projectFilter;
      const matchRole = roleFilter === 'All' || m.role === roleFilter;

      return matchSearch && matchProject && matchRole;
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
          borderRadius: '12px'
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Resource Allocation & Team Capacity
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Manage cross-functional delivery squads, assign roles, and monitor resource workloads.
          </div>
        </div>

        <PrimaryButton
          text="Assign Team Member"
          iconProps={{ iconName: 'AddFriend' }}
          onClick={() => setIsModalOpen(true)}
          styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
        />
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          padding: '16px 20px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <div style={{ width: '220px' }}>
          <SearchBox
            placeholder="Search member or role..."
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

        <div style={{ width: '180px' }}>
          <Dropdown
            selectedKey={roleFilter}
            options={roleOptions}
            onChange={(_, opt) => opt && setRoleFilter(String(opt.key))}
            styles={{ root: { borderRadius: '6px' } }}
          />
        </div>
      </div>

      {/* Team Members Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
          gap: '18px'
        }}
      >
        {filteredMembers.map(m => {
          const p = projects.find(prj => prj.id === m.projectId);
          return (
            <div
              key={m.id}
              style={{
                padding: '20px',
                backgroundColor: themeStyles.bgCard,
                border: `1px solid ${themeStyles.border}`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Persona
                  text={m.user.title}
                  secondaryText={m.user.email}
                  size={PersonaSize.size40}
                  styles={{
                    primaryText: { color: themeStyles.textPrimary, fontWeight: 700, fontSize: '14px' },
                    secondaryText: { color: themeStyles.textMuted, fontSize: '12px' }
                  }}
                />
                <IconButton
                  iconProps={{ iconName: 'Cancel' }}
                  title="Unassign"
                  onClick={() => handleRemoveMember(m.id)}
                  styles={{ root: { color: themeStyles.accentRed } }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 168, 232, 0.15)',
                    color: themeStyles.accentBlue,
                    fontWeight: 600
                  }}
                >
                  {m.role}
                </span>
                <span style={{ color: themeStyles.textSecondary, fontWeight: 500 }}>
                  {p ? `${p.projectId}` : 'Global'}
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: themeStyles.textMuted, marginBottom: '4px' }}>
                  <span>Capacity Allocation</span>
                  <span style={{ fontWeight: 700, color: themeStyles.textPrimary }}>{m.allocationPercentage}%</span>
                </div>
                <ProgressIndicator
                  percentComplete={m.allocationPercentage / 100}
                  styles={{
                    progressBar: {
                      backgroundColor: m.allocationPercentage > 100 ? themeStyles.accentRed : themeStyles.accentGreen
                    }
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Assign Team Member */}
      <Modal
        isOpen={isModalOpen}
        onDismiss={() => setIsModalOpen(false)}
        styles={{
          main: {
            width: '500px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${themeStyles.border}` }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Assign Team Member to Project
          </h3>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <TextField
            label="Member Full Name"
            required
            value={newMemberName}
            onChange={(_, val) => setNewMemberName(val || '')}
          />
          <TextField
            label="Work Email"
            value={newMemberEmail}
            onChange={(_, val) => setNewMemberEmail(val || '')}
          />
          <Dropdown
            label="Project"
            required
            selectedKey={newMemberProjectId}
            options={projectOptions.filter(o => o.key !== 'All')}
            onChange={(_, opt) => opt && setNewMemberProjectId(Number(opt.key))}
          />
          <Dropdown
            label="Role"
            selectedKey={newMemberRole}
            options={roleOptions.filter(o => o.key !== 'All')}
            onChange={(_, opt) => opt && setNewMemberRole(opt.key as TeamRole)}
          />
          <Slider
            label={`Allocation: ${newMemberAllocation}%`}
            min={10}
            max={120}
            step={10}
            value={newMemberAllocation}
            onChange={val => setNewMemberAllocation(val)}
          />
        </div>

        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: `1px solid ${themeStyles.border}`,
            backgroundColor: themeStyles.bgCardHover
          }}
        >
          <DefaultButton text="Cancel" onClick={() => setIsModalOpen(false)} />
          <PrimaryButton
            text="Assign to Project"
            onClick={handleAssignMember}
            styles={{ root: { backgroundColor: themeStyles.accentBlue } }}
          />
        </div>
      </Modal>
    </div>
  );
};
