# Power Automate Integration Guide

## Overview

The **Enterprise Project & Workflow Management Portal** integrates with Microsoft Power Automate to deliver enterprise notifications, automated approval routing, and email alerts without hardcoding credentials or secrets in frontend code.

---

## 1. Automated Approval Workflow Flow

### Trigger: "When an HTTP request is received"
In Power Automate (cloud flow):
1. Create an Automated Cloud Flow.
2. Select trigger: **"When an HTTP request is received"**.
3. Set **Who Can Trigger The Flow**: Anyone or Anyone in your tenant.
4. Set Request Body JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "action": { "type": "string" },
    "id": { "type": "number" },
    "itemType": { "type": "string" },
    "itemId": { "type": "number" },
    "itemTitle": { "type": "string" },
    "requestedBy": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "email": { "type": "string" }
      }
    },
    "approver": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "email": { "type": "string" }
      }
    },
    "comments": { "type": "string" },
    "status": { "type": "string" }
  }
}
```

5. Copy the generated **HTTP POST URL** and paste it into the portal's **Settings &rarr; Dynamic Configuration &rarr; Power Automate Workflow Webhook URL**.

---

## 2. Actions inside the Flow

### Step A: Send Email with Options or Approvals Connector
1. Add Action: **"Start and wait for an approval"** (or **"Send an email with options"**).
2. Approval type: `Approve/Reject - First to respond`.
3. Title: `Approval Required: @{triggerBody()?['itemTitle']}`.
4. Assigned To: `@{triggerBody()?['approver']?['email']}`.
5. Details:
   ```markdown
   A new governance review has been requested.
   
   - **Item**: @{triggerBody()?['itemTitle']}
   - **Type**: @{triggerBody()?['itemType']}
   - **Submitted By**: @{triggerBody()?['requestedBy']?['title']} (@{triggerBody()?['requestedBy']?['email']})
   - **Notes**: @{triggerBody()?['comments']}
   ```

### Step B: Post Adaptive Card to Microsoft Teams (Optional)
1. Add Action: **"Post adaptive card in a chat or channel"**.
2. Post as: `Flow bot` in `Chat with Flow bot`.
3. Recipient: `@{triggerBody()?['approver']?['email']}`.

### Step C: Update SharePoint Approval Item
1. Add Action: **"Update item"** in SharePoint.
2. Site Address: Select your Project Portal site.
3. List Name: `ProjectApprovals`.
4. Id: `@{triggerBody()?['id']}`.
5. ApprovalStatus: Outcome of approval (`Approved` or `Rejected`).
6. Comments: Comments from approver response.

---

## 3. Scheduled Deadline & Overdue Reminder Flow

### Trigger: Recurrence (Daily at 08:00 AM)
1. Set recurrence to run every morning.
2. Add Action: **"Get items"** from `ProjectTasks` list:
   - Filter Query: `TaskStatus ne 'Completed' and DueDate le '@{utcNow()}'`
3. Add **"Apply to each"**:
   - Add Action: **"Send an email (V2)"** to `@{items('Apply_to_each')?['AssignedTo']?['Email']}`:
     - Subject: `[URGENT] Overdue Task Notification: @{items('Apply_to_each')?['Title']}`
     - Body: Explaining that the deliverable has passed its target deadline.
