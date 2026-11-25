import { SharePointService } from './SharePointService';
import { IApprovalItem, IListMappingConfig, ApprovalStatus } from '../models';
import { INITIAL_APPROVALS } from './MockData';
import { ProjectService } from './ProjectService';

export class ApprovalService {
  private static instance: ApprovalService;
  private memoryApprovals: IApprovalItem[] = [...INITIAL_APPROVALS];

  private constructor() {}

  public static getInstance(): ApprovalService {
    if (!ApprovalService.instance) {
      ApprovalService.instance = new ApprovalService();
    }
    return ApprovalService.instance;
  }

  public async getApprovals(config: IListMappingConfig): Promise<IApprovalItem[]> {
    const spService = SharePointService.getInstance();
    if (spService.isConnected()) {
      try {
        const listName = config.approvalsList || 'ProjectApprovals';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          const items = await sp.web.lists.getByTitle(listName).items
            .select(
              'Id',
              'Title',
              'ItemType',
              'ItemIdRef',
              'ItemTitle',
              'ApprovalStatus',
              'SubmissionDate',
              'DecisionDate',
              'Comments',
              'RequestedBy/Id',
              'RequestedBy/Title',
              'RequestedBy/EMail',
              'Approver/Id',
              'Approver/Title',
              'Approver/EMail'
            )
            .expand('RequestedBy', 'Approver')
            .top(300)();

          return items.map(i => ({
            id: i.Id,
            itemType: i.ItemType as 'Project' | 'Task',
            itemId: Number(i.ItemIdRef) || 0,
            itemTitle: i.ItemTitle || i.Title,
            requestedBy: i.RequestedBy ? {
              id: i.RequestedBy.Id,
              title: i.RequestedBy.Title,
              email: i.RequestedBy.EMail
            } : { id: 0, title: 'Unknown', email: '' },
            approver: i.Approver ? {
              id: i.Approver.Id,
              title: i.Approver.Title,
              email: i.Approver.EMail
            } : { id: 0, title: 'Unassigned', email: '' },
            status: (i.ApprovalStatus as ApprovalStatus) || 'Pending',
            submissionDate: i.SubmissionDate || new Date().toISOString(),
            decisionDate: i.DecisionDate,
            comments: i.Comments
          }));
        }
      } catch (err) {
        console.warn('[ApprovalService] Could not retrieve SharePoint approvals. Returning local store.', err);
      }
    }
    return [...this.memoryApprovals];
  }

  public async submitApproval(approval: Omit<IApprovalItem, 'id' | 'status' | 'submissionDate'>, config: IListMappingConfig): Promise<IApprovalItem> {
    const spService = SharePointService.getInstance();
    let newId = Date.now();
    const submissionDate = new Date().toISOString();

    if (spService.isConnected()) {
      try {
        const listName = config.approvalsList || 'ProjectApprovals';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          const itemPayload: any = {
            Title: `Approval: ${approval.itemTitle}`,
            ItemType: approval.itemType,
            ItemIdRef: String(approval.itemId),
            ItemTitle: approval.itemTitle,
            ApprovalStatus: 'Pending',
            SubmissionDate: submissionDate,
            Comments: approval.comments || ''
          };
          if (approval.requestedBy?.id) itemPayload.RequestedById = approval.requestedBy.id;
          if (approval.approver?.id) itemPayload.ApproverId = approval.approver.id;

          const res = await sp.web.lists.getByTitle(listName).items.add(itemPayload);
          newId = res.data.Id;
        }
      } catch (err) {
        console.warn('[ApprovalService] Failed to record approval in SharePoint. Storing in memory store.', err);
      }
    }

    const created: IApprovalItem = {
      ...approval,
      id: newId,
      status: 'Pending',
      submissionDate
    };
    this.memoryApprovals.unshift(created);

    // If a Power Automate Webhook URL is configured, trigger the automated approval email flow
    if (config.powerAutomateWebhookUrl) {
      this.triggerPowerAutomateWebhook(config.powerAutomateWebhookUrl, created);
    }

    ProjectService.getInstance().logActivity(approval.itemId, 'Approval Requested', `Approval request submitted for ${approval.itemType}: '${approval.itemTitle}'.`);
    return created;
  }

  public async reviewApproval(
    id: number,
    status: 'Approved' | 'Rejected',
    comments: string,
    config: IListMappingConfig
  ): Promise<IApprovalItem> {
    const spService = SharePointService.getInstance();
    const decisionDate = new Date().toISOString();

    if (spService.isConnected()) {
      try {
        const listName = config.approvalsList || 'ProjectApprovals';
        if (await spService.checkListExists(listName)) {
          const sp = spService.getSP();
          await sp.web.lists.getByTitle(listName).items.getById(id).update({
            ApprovalStatus: status,
            DecisionDate: decisionDate,
            Comments: comments
          });
        }
      } catch (err) {
        console.warn(`[ApprovalService] Could not update SharePoint approval item ${id}:`, err);
      }
    }

    const idx = this.memoryApprovals.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.memoryApprovals[idx] = {
        ...this.memoryApprovals[idx],
        status,
        decisionDate,
        comments
      };

      // Notify Power Automate if configured
      if (config.powerAutomateWebhookUrl) {
        this.triggerPowerAutomateWebhook(config.powerAutomateWebhookUrl, {
          action: 'REVIEW_COMPLETED',
          approval: this.memoryApprovals[idx]
        });
      }

      ProjectService.getInstance().logActivity(
        this.memoryApprovals[idx].itemId,
        `Approval ${status}`,
        `Approval for '${this.memoryApprovals[idx].itemTitle}' marked as ${status}.`
      );
      return this.memoryApprovals[idx];
    }
    throw new Error(`Approval item with id ${id} not found.`);
  }

  private async triggerPowerAutomateWebhook(url: string, payload: any): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      console.log('[ApprovalService] Power Automate flow triggered successfully.');
    } catch (err) {
      console.error('[ApprovalService] Power Automate trigger error:', err);
    }
  }
}
