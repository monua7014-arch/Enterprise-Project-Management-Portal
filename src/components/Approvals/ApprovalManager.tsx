import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ApprovalService, ProjectService, TaskService } from '../../services';
import { IApprovalItem, IProjectItem, ITaskItem, ApprovalStatus } from '../../models';
import { getStatusBadgeStyle } from '../../styles/theme';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  Modal, 
  TextField, 
  Dropdown, 
  IDropdownOption, 
  Pivot, 
  PivotItem, 
  Dialog, 
  DialogType, 
  DialogFooter,
  SearchBox 
} from '@fluentui/react';

export const ApprovalManager: React.FC = () => {
  const { config, themeStyles, currentTheme, refreshTrigger, triggerRefresh, showToast, currentUser } = useApp();
  const isDark = currentTheme === 'dark';

  const [loading, setLoading] = useState<boolean>(true);
  const [approvals, setApprovals] = useState<IApprovalItem[]>([]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('Pending');

  // Submit Request Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [requestItemType, setRequestItemType] = useState<'Project' | 'Task'>('Project');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [approverEmail, setApproverEmail] = useState<string>('executive.sponsor@contoso.com');
  const [requestComments, setRequestComments] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Review Dialog State
  const [approvalToReview, setApprovalToReview] = useState<IApprovalItem | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [decisionComments, setDecisionComments] = useState<string>('');
  const [reviewing, setReviewing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [config, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aList, pList, tList] = await Promise.all([
        ApprovalService.getInstance().getApprovals(config),
        ProjectService.getInstance().getProjects(config),
        TaskService.getInstance().getTasks(config)
      ]);
      setApprovals(aList);
      setProjects(pList);
      setTasks(tList);
      if (pList.length > 0) setSelectedItemId(pList[0].id);
    } catch (err) {
      console.error('[ApprovalManager] Error loading approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    setSubmitting(true);
    try {
      let itemTitle = 'Untitled Deliverable';
      if (requestItemType === 'Project') {
        const p = projects.find(prj => prj.id === selectedItemId);
        if (p) itemTitle = `${p.projectId}: ${p.title}`;
      } else {
        const t = tasks.find(tsk => tsk.id === selectedItemId);
        if (t) itemTitle = `${t.taskId}: ${t.title}`;
      }

      await ApprovalService.getInstance().submitApproval(
        {
          itemType: requestItemType,
          itemId: selectedItemId,
          itemTitle,
          requestedBy: currentUser,
          approver: {
            id: 0,
            title: approverEmail.split('@')[0],
            email: approverEmail
          },
          comments: requestComments
        },
        config
      );

      showToast('Approval request submitted with Power Automate dispatch!', 'success');
      setIsSubmitModalOpen(false);
      setRequestComments('');
      triggerRefresh();
    } catch (err: any) {
      showToast('Failed to dispatch approval request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessDecision = async () => {
    if (!approvalToReview) return;
    setReviewing(true);
    try {
      await ApprovalService.getInstance().reviewApproval(
        approvalToReview.id,
        decision,
        decisionComments,
        config
      );

      showToast(`Governance decision '${decision}' recorded.`, 'success');
      setApprovalToReview(null);
      setDecisionComments('');
      triggerRefresh();
    } catch (err: any) {
      showToast('Error recording governance decision.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const filteredApprovals = useMemo(() => {
    return approvals.filter(a => {
      const matchesTab = selectedTab === 'All' || a.status === selectedTab;
      const matchesSearch = !searchQuery || a.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) || a.requestedBy.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [approvals, selectedTab, searchQuery]);

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
            Governance & Executive Approvals Hub
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            Multi-stage audit trail, age indicators, and Power Automate workflow dispatch
          </div>
        </div>

        <PrimaryButton
          text="Submit Approval Request"
          iconProps={{ iconName: 'Send' }}
          onClick={() => setIsSubmitModalOpen(true)}
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

      {/* Approvals Table Card */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: themeStyles.cardShadow
        }}
      >
        {/* Navigation Tabs & Search */}
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${themeStyles.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Pending', 'Approved', 'Rejected', 'All'].map(tab => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: selectedTab === tab ? themeStyles.accentBlue : 'transparent',
                  color: selectedTab === tab ? '#fff' : themeStyles.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                {tab} ({approvals.filter(a => tab === 'All' || a.status === tab).length})
              </button>
            ))}
          </div>

          <div style={{ width: '220px' }}>
            <SearchBox
              placeholder="Search deliverable or requester..."
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

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary, textTransform: 'uppercase', fontSize: '10.5px' }}>
                <th style={{ padding: '12px 18px' }}>Deliverable / Item</th>
                <th style={{ padding: '12px 14px' }}>Type</th>
                <th style={{ padding: '12px 14px' }}>Requested By</th>
                <th style={{ padding: '12px 14px' }}>Assigned Approver</th>
                <th style={{ padding: '12px 14px' }}>Submission Age</th>
                <th style={{ padding: '12px 14px' }}>Status</th>
                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredApprovals.map(a => {
                const subDate = new Date(a.submissionDate);
                const ageDays = Math.max(0, Math.floor((new Date().getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24)));

                return (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${themeStyles.borderLight}` }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontWeight: 700, color: themeStyles.textPrimary }}>{a.itemTitle}</div>
                      {a.comments && (
                        <div style={{ fontSize: '11px', color: themeStyles.textMuted, marginTop: '2px' }}>
                          "{a.comments}"
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', color: themeStyles.accentBlue }}>
                      {a.itemType}
                    </td>
                    <td style={{ padding: '12px 14px', color: themeStyles.textPrimary }}>
                      {a.requestedBy.title}
                    </td>
                    <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>
                      {a.approver.email}
                    </td>
                    <td style={{ padding: '12px 14px', color: ageDays > 3 && a.status === 'Pending' ? '#f43f5e' : themeStyles.textSecondary, fontWeight: ageDays > 3 ? 700 : 400 }}>
                      {ageDays === 0 ? 'Today' : `${ageDays}d ago`}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={getStatusBadgeStyle(a.status, isDark)}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      {a.status === 'Pending' ? (
                        <PrimaryButton
                          text="Review"
                          onClick={() => {
                            setApprovalToReview(a);
                            setDecision('Approved');
                          }}
                          styles={{
                            root: {
                              borderRadius: '6px',
                              height: '28px',
                              fontSize: '11.5px',
                              backgroundColor: themeStyles.accentBlue
                            }
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      {approvalToReview && (
        <Dialog
          hidden={!approvalToReview}
          onDismiss={() => setApprovalToReview(null)}
          dialogContentProps={{
            type: DialogType.normal,
            title: `Executive Governance Review: ${approvalToReview.itemTitle}`,
            subText: `Requested by ${approvalToReview.requestedBy.title}`
          }}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, color: themeStyles.textPrimary }
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            <Dropdown
              label="Governance Decision"
              selectedKey={decision}
              options={[
                { key: 'Approved', text: 'Approve & Release Deliverable' },
                { key: 'Rejected', text: 'Reject & Request Revisions' }
              ]}
              onChange={(_, opt) => opt && setDecision(opt.key as 'Approved' | 'Rejected')}
            />
            <TextField
              label="Executive Comments / Justification"
              multiline
              rows={3}
              value={decisionComments}
              onChange={(_, val) => setDecisionComments(val || '')}
              placeholder="Provide governance context or revision instructions..."
            />
          </div>
          <DialogFooter>
            <PrimaryButton
              text={reviewing ? 'Recording...' : `Confirm ${decision}`}
              disabled={reviewing}
              onClick={handleProcessDecision}
              styles={{
                root: {
                  backgroundColor: decision === 'Approved' ? '#10b981' : '#f43f5e',
                  borderColor: decision === 'Approved' ? '#10b981' : '#f43f5e'
                }
              }}
            />
            <DefaultButton text="Cancel" onClick={() => setApprovalToReview(null)} />
          </DialogFooter>
        </Dialog>
      )}

      {/* Submit Approval Modal */}
      {isSubmitModalOpen && (
        <Modal
          isOpen={isSubmitModalOpen}
          onDismiss={() => setIsSubmitModalOpen(false)}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, borderRadius: '12px', padding: '24px', width: '450px', color: themeStyles.textPrimary }
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Dispatch Approval Request</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Dropdown
              label="Deliverable Category"
              selectedKey={requestItemType}
              options={[
                { key: 'Project', text: 'Full Project Milestone Sign-off' },
                { key: 'Task', text: 'Individual Technical Task' }
              ]}
              onChange={(_, opt) => opt && setRequestItemType(opt.key as 'Project' | 'Task')}
            />
            <Dropdown
              label="Select Deliverable"
              selectedKey={selectedItemId}
              options={
                requestItemType === 'Project'
                  ? projects.map(p => ({ key: p.id, text: p.title }))
                  : tasks.map(t => ({ key: t.id, text: t.title }))
              }
              onChange={(_, opt) => opt && setSelectedItemId(Number(opt.key))}
            />
            <TextField
              label="Approver Corporate Email"
              value={approverEmail}
              onChange={(_, val) => setApproverEmail(val || '')}
              required
            />
            <TextField
              label="Submission Justification"
              multiline
              rows={2}
              value={requestComments}
              onChange={(_, val) => setRequestComments(val || '')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <DefaultButton text="Cancel" onClick={() => setIsSubmitModalOpen(false)} />
            <PrimaryButton
              text={submitting ? 'Dispatching...' : 'Dispatch to Approver'}
              disabled={submitting}
              onClick={handleSubmitRequest}
              styles={{ root: { backgroundColor: themeStyles.accentBlue } }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
