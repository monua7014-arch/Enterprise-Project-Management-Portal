# Enterprise Project & Workflow Portal - Testing & Verification Checklist

## 1. Environment & Build Integrity
- [x] Node.js `18.18.2` compatibility confirmed.
- [x] SPFx `1.18.2` generator & packages aligned.
- [x] React `17.0.1` and `@fluentui/react` `8.106.4` clean integration.
- [x] PnPjs `@pnp/sp` v3.20.0 initialization with SPFx context.
- [x] `gulp bundle` compiles with zero TypeScript errors.
- [x] `gulp package-solution --ship` generates production-ready `.sppkg`.

---

## 2. Module Verification Matrix

### Module 1: Executive Dashboard
- [x] 8 KPI cards render with dynamic metrics (Total Projects, Active, Completed, Delayed, Tasks, Overdue, Approvals).
- [x] Status distribution bar displays percentage breakdown.
- [x] Task priority breakdown displays critical/high/medium/low counts.
- [x] Recent projects list with progress indicators.
- [x] Upcoming deadlines list with overdue flags.
- [x] SharePoint activity feed shows recent system events.

### Module 2: Project Management
- [x] Create project modal with validation (mandatory fields, non-negative budget).
- [x] Edit project modal with pre-populated values.
- [x] View project detail screen with timeline and progress.
- [x] Delete project with confirmation dialog.
- [x] Search by title, project ID, client name.
- [x] Filter by status and priority.
- [x] Column sorting (ID, Title, Budget, Progress).
- [x] Custom pagination.
- [x] Project milestone management (add milestone, toggle completion, delete).

### Module 3: Task Management & Kanban Board
- [x] Create/edit task modal with project lookup and user assignment.
- [x] Interactive Kanban board with 4 workflow columns.
- [x] Native HTML5 drag-and-drop between columns.
- [x] State persistence to SharePoint upon drag drop.
- [x] Overdue visual indicators on tasks past target due date.
- [x] Table list view and Kanban board view toggle.

### Module 4: Excel Bulk Upload
- [x] Download pre-formatted Excel template (`.xlsx`) with sample rows.
- [x] Drag-and-drop file upload zone.
- [x] Schema and data type validation (dates, numbers, mandatory fields).
- [x] Duplicate detection within file and against existing SharePoint items.
- [x] Row-level error grid with specific failure reasons.
- [x] Batch import valid rows with progress indicator.
- [x] Download rejected rows error report (`.xlsx`).

### Module 5: Document Management
- [x] Upload files to SharePoint document library (`ProjectDocuments`).
- [x] Categorize documents (Architecture, Design, Requirements, Contract, Deliverable, etc.).
- [x] Link documents to specific projects.
- [x] Open / download files from library.
- [x] Delete document with confirmation.

### Module 6: Approval Management
- [x] Submit project or task for governance approval.
- [x] Pending approvals dashboard.
- [x] Decision modal (Approve / Reject) with comments.
- [x] Audit trail and approval history.
- [x] Dispatches HTTP trigger to Power Automate webhook.

### Module 7: Team Management
- [x] Resource workload & capacity visual indicator.
- [x] Assign team members to projects with specific roles and allocation percentages.
- [x] Filter by project and role.

### Module 8 & 9: Reports & Notifications
- [x] Project status & budget report.
- [x] Task delivery report.
- [x] Overdue risk audit report.
- [x] Workload distribution per team member.
- [x] Export to Excel (`.xlsx`) with SheetJS formatting.
- [x] Print-ready PDF view.
- [x] Notification bell with unread dropdown and real-time toast alerts.

### Module 10: Dynamic Configuration
- [x] Discovers SharePoint site lists live.
- [x] Discovers list fields and schema types.
- [x] Configurable list name and column mappings to prevent hardcoding.
- [x] Power Automate webhook endpoint configuration.
