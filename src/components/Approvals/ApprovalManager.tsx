import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApprovalService, ProjectService, TaskService } from '../../services';
import { IApprovalItem, IProjectItem, ITaskItem, ApprovalStatus } from '../../models';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  Modal, 
  TextField, 
  Dropdown, 
  IDropdownOption, 
  Spinner, 
  SpinnerSize, 
  Pivot, 
  PivotItem, 
  Dialog, 
  DialogType, 
  DialogFooter 
} from '@fluentui/react';

export const ApprovalManager: React.FC = () => {
  const { config, themeStyles, refreshTrigger, triggerRefresh, showToast, currentUser } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [approvals, setApprovals] = useState<IApprovalItem[]>([]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);

  // Submit Request Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [requestItemType, setRequestItemType] = useState<'Project' | 'Task'>('Project');
  const [selectedItemId, setSelectedItemId] = useState<number>(0);
  const [approverEmail, setApproverEmail] = useState<string>('approver@tenant.com');
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
      let itemTitle = 'Untitled';
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

      showToast('Approval request submitted successfully!', 'success');
      setIsSubmitModalOpen(false);
      setRequestComments('');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Error submitting request: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!approvalToReview) return;
    setReviewing(true);
    try {
      await ApprovalService.getInstance().reviewApproval(
        approvalToReview.id,
        decision,
        decisionComments || `Decision: ${decision}`,
        config
      );
      showToast(`Approval marked as ${decision}.`, 'success');
      setApprovalToReview(null);
      setDecisionComments('');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Review failed: ${err.message}`, 'error');
    } finally {
      setReviewing(false);
    }
  };

  const pendingApprovals = approvals.filter(a => a.status === 'Pending');
  const pastApprovals = approvals.filter(a => a.status !== 'Pending');

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
            Governance & Approval Workflow Hub
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Submit, review, and audit project changes and milestone sign-offs integrated with Power Automate.
          </div>
        </div>

        <PrimaryButton
          text="Submit Approval Request"
          iconProps={{ iconName: 'CheckList' }}
          onClick={() => setIsSubmitModalOpen(true)}
          styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
        />
      </div>

      {/* KPI Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: themeStyles.accentAmber, fontWeight: 600 }}>Pending Review</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentAmber, marginTop: '4px' }}>
            {pendingApprovals.length}
          </div>
        </div>

        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: themeStyles.accentGreen, fontWeight: 600 }}>Approved Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentGreen, marginTop: '4px' }}>
            {approvals.filter(a => a.status === 'Approved').length}
          </div>
        </div>

        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: themeStyles.accentRed, fontWeight: 600 }}>Rejected Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentRed, marginTop: '4px' }}>
            {approvals.filter(a => a.status === 'Rejected').length}
          </div>
        </div>
      </div>

      {/* Tabbed View: Pending vs History */}
      <div
        style={{
          padding: '20px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px'
        }}
      >
        <Pivot aria-label="Approvals Hub">
          <PivotItem headerText={`Pending Decisions (${pendingApprovals.length})`}>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Spinner size={SpinnerSize.large} label="Loading pending approvals..." />
                </div>
              ) : pendingApprovals.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: themeStyles.textMuted }}>
                  <i className="ms-Icon ms-Icon--CompletedSolid" style={{ fontSize: '32px', color: themeStyles.accentGreen, marginBottom: '8px', display: 'block' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Zero Pending Approvals</div>
                  <div style={{ fontSize: '12px' }}>All submitted requests have been reviewed.</div>
                </div>
              ) : (
                pendingApprovals.map(a => (
                  <div
                    key={a.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      border: `1px solid ${themeStyles.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: themeStyles.accentAmber,
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {a.itemType}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
                          {a.itemTitle}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: themeStyles.textSecondary, marginTop: '4px' }}>
                        Requested by: <strong>{a.requestedBy.title}</strong> &nbsp;|&nbsp;
                        Submitted: {new Date(a.submissionDate).toLocaleDateString()}
                      </div>
                      {a.comments && (
                        <div style={{ fontSize: '12px', color: themeStyles.textMuted, marginTop: '4px', fontStyle: 'italic' }}>
                          "{a.comments}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <PrimaryButton
                        text="Review & Decide"
                        iconProps={{ iconName: 'CheckboxComposite' }}
                        onClick={() => {
                          setApprovalToReview(a);
                          setDecision('Approved');
                          setDecisionComments('');
                        }}
                        styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </PivotItem>

          <PivotItem headerText={`Approval History (${pastApprovals.length})`}>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pastApprovals.map(a => {
                const isApproved = a.status === 'Approved';
                return (
                  <div
                    key={a.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      backgroundColor: themeStyles.bgCardHover,
                      border: `1px solid ${themeStyles.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isApproved ? themeStyles.accentGreen : themeStyles.accentRed,
                            fontSize: '11px',
                            fontWeight: 700
                          }}
                        >
                          {a.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '13.5px', fontWeight: 600, color: themeStyles.textPrimary }}>
                          {a.itemTitle}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: themeStyles.textMuted, marginTop: '4px' }}>
                        Decided on {a.decisionDate ? new Date(a.decisionDate).toLocaleDateString() : 'N/A'}: &nbsp;
                        {a.comments ? `"${a.comments}"` : 'No review notes'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PivotItem>
        </Pivot>
      </div>

      {/* Review Dialog */}
      <Dialog
        hidden={!approvalToReview}
        onDismiss={() => setApprovalToReview(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Review Approval Request',
          subText: `Reviewing: ${approvalToReview?.itemTitle}`
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
          <Dropdown
            label="Decision"
            selectedKey={decision}
            options={[
              { key: 'Approved', text: 'Approve Request' },
              { key: 'Rejected', text: 'Reject Request' }
            ]}
            onChange={(_, opt) => opt && setDecision(opt.key as any)}
          />
          <TextField
            label="Reviewer Comments"
            multiline
            rows={3}
            placeholder="Provide justification or conditions for this decision..."
            value={decisionComments}
            onChange={(_, val) => setDecisionComments(val || '')}
          />
        </div>

        <DialogFooter>
          <PrimaryButton
            text={reviewing ? 'Recording...' : `Confirm ${decision}`}
            onClick={handleReviewSubmit}
            disabled={reviewing}
            styles={{
              root: {
                backgroundColor: decision === 'Approved' ? themeStyles.accentGreen : themeStyles.accentRed,
                borderColor: decision === 'Approved' ? themeStyles.accentGreen : themeStyles.accentRed
              }
            }}
          />
          <DefaultButton text="Cancel" onClick={() => setApprovalToReview(null)} disabled={reviewing} />
        </DialogFooter>
      </Dialog>

      {/* Submit Request Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onDismiss={() => setIsSubmitModalOpen(false)}
        styles={{
          main: {
            width: '540px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${themeStyles.border}` }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Submit for Governance Review
          </h3>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Dropdown
            label="Submission Item Type"
            selectedKey={requestItemType}
            options={[
              { key: 'Project', text: 'Project Milestone / Budget Review' },
              { key: 'Task', text: 'Task / Deliverable Review' }
            ]}
            onChange={(_, opt) => opt && setRequestItemType(opt.key as any)}
          />

          {requestItemType === 'Project' ? (
            <Dropdown
              label="Select Project"
              selectedKey={selectedItemId}
              options={projects.map(p => ({ key: p.id, text: `${p.projectId}: ${p.title}` }))}
              onChange={(_, opt) => opt && setSelectedItemId(Number(opt.key))}
            />
          ) : (
            <Dropdown
              label="Select Task"
              selectedKey={selectedItemId}
              options={tasks.map(t => ({ key: t.id, text: `${t.taskId}: ${t.title}` }))}
              onChange={(_, opt) => opt && setSelectedItemId(Number(opt.key))}
            />
          )}

          <TextField
            label="Assigned Approver Email"
            value={approverEmail}
            onChange={(_, val) => setApproverEmail(val || '')}
          />

          <TextField
            label="Request Justification & Notes"
            multiline
            rows={3}
            placeholder="Explain why this requires executive sign-off..."
            value={requestComments}
            onChange={(_, val) => setRequestComments(val || '')}
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
          <DefaultButton text="Cancel" onClick={() => setIsSubmitModalOpen(false)} disabled={submitting} />
          <PrimaryButton
            text={submitting ? 'Submitting...' : 'Submit to SharePoint'}
            onClick={handleSubmitRequest}
            disabled={submitting}
            styles={{ root: { backgroundColor: themeStyles.accentBlue } }}
          />
        </div>
      </Modal>
    </div>
  );
};
