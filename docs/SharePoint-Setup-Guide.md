# SharePoint Online Architecture & Provisioning Guide

## Overview

The **Enterprise Project & Workflow Management Portal (SPFx)** operates on top of native SharePoint Online Lists and Libraries. It is built with dynamic discovery and schema mapping capabilities, so list and column names can be configured flexibly.

---

## 1. Required SharePoint Lists & Document Libraries

| # | List / Library Name | Type | Purpose |
|---|---------------------|------|---------|
| 1 | `Projects` | SharePoint List | Stores core project metadata, budget, timelines, and status |
| 2 | `ProjectTasks` | SharePoint List | Stores work breakdown tasks, assignees, priorities, and progress |
| 3 | `ProjectMilestones` | SharePoint List | Deliverables and schedule milestone tracking |
| 4 | `ProjectApprovals` | SharePoint List | Governance records, approval/rejection decisions, audit trail |
| 5 | `ProjectTeam` | SharePoint List | Project-specific team assignments, roles, and capacity allocation |
| 6 | `ProjectDocuments` | Document Library | Project specifications, contracts, architecture drawings, and deliverables |
| 7 | `ProjectActivityLogs` | SharePoint List | Audit log of project events, progress changes, and completions |
| 8 | `ProjectNotifications` | SharePoint List | System alerts and user notifications |

---

## 2. Detailed Column Schema & Data Types

### 1. `Projects` List
- **`Title`** (Single line of text, Required) &rarr; Project Name
- **`ProjectID`** (Single line of text, Required, Indexed) &rarr; e.g., `PRJ-2026-001`
- **`ProjectDescription`** (Multiple lines of text, Plain text)
- **`ClientName`** (Single line of text, Required)
- **`ProjectManager`** (Person or Group, Allow single user)
- **`StartDate`** (Date and Time, Date only)
- **`EndDate`** (Date and Time, Date only)
- **`ProjectBudget`** (Number / Currency, Decimal places: 2)
- **`ProjectStatus`** (Choice: `Planning`, `Active`, `On Hold`, `Delayed`, `Completed`, `Cancelled`, Default: `Planning`)
- **`Priority`** (Choice: `Low`, `Medium`, `High`, `Critical`, Default: `Medium`)
- **`ProjectProgress`** (Number, Min: 0, Max: 100)
- **`AssignedTeam`** (Person or Group, Allow multiple selections)

### 2. `ProjectTasks` List
- **`Title`** (Single line of text, Required) &rarr; Task Title
- **`TaskID`** (Single line of text, Required, Indexed) &rarr; e.g., `TSK-101`
- **`TaskDescription`** (Multiple lines of text, Plain text)
- **`ProjectLookup`** (Lookup &rarr; `Projects` list, Column: `Title`)
- **`AssignedTo`** (Person or Group, Allow single user)
- **`StartDate`** (Date and Time, Date only)
- **`DueDate`** (Date and Time, Date only)
- **`Priority`** (Choice: `Low`, `Medium`, `High`, `Critical`, Default: `Medium`)
- **`TaskStatus`** (Choice: `To Do`, `In Progress`, `Under Review`, `Completed`, Default: `To Do`)
- **`CompletionPercentage`** (Number, Min: 0, Max: 100)

### 3. `ProjectMilestones` List
- **`Title`** (Single line of text, Required) &rarr; Milestone Name
- **`ProjectLookup`** (Lookup &rarr; `Projects` list, Column: `Title`)
- **`DueDate`** (Date and Time, Date only)
- **`MilestoneStatus`** (Choice: `Pending`, `In Progress`, `Completed`, Default: `Pending`)
- **`CompletedDate`** (Date and Time, Date only, Optional)

### 4. `ProjectApprovals` List
- **`Title`** (Single line of text, Required) &rarr; Approval Subject
- **`ItemType`** (Choice: `Project`, `Task`)
- **`ItemIdRef`** (Single line of text) &rarr; Target ID
- **`ItemTitle`** (Single line of text) &rarr; Target Title
- **`RequestedBy`** (Person or Group, Allow single user)
- **`Approver`** (Person or Group, Allow single user)
- **`ApprovalStatus`** (Choice: `Pending`, `Approved`, `Rejected`, Default: `Pending`)
- **`SubmissionDate`** (Date and Time)
- **`DecisionDate`** (Date and Time, Optional)
- **`Comments`** (Multiple lines of text)

### 5. `ProjectDocuments` Library (Document Library)
- **`Title`** (Single line of text) &rarr; Document Display Title
- **`ProjectLookup`** (Lookup &rarr; `Projects` list, Column: `Title`)
- **`DocumentCategory`** (Choice: `Architecture`, `Design`, `Requirements`, `Contract`, `Deliverable`, `Meeting Notes`, `Other`)

---

## 3. Automated PnP PowerShell Provisioning Script

Run the following script using **PnP.PowerShell** to automatically create all lists and fields:

```powershell
# Connect to your SharePoint Online site
$SiteUrl = "https://yourtenant.sharepoint.com/sites/ProjectPortal"
Connect-PnPOnline -Url $SiteUrl -Interactive

# 1. Projects List
New-PnPList -Title "Projects" -Template GenericList -EnableVersioning
Add-PnPField -List "Projects" -DisplayName "ProjectID" -InternalName "ProjectID" -Type Text -Required -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "ProjectDescription" -InternalName "ProjectDescription" -Type Note
Add-PnPField -List "Projects" -DisplayName "ClientName" -InternalName "ClientName" -Type Text -Required -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "ProjectManager" -InternalName "ProjectManager" -Type User -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "StartDate" -InternalName "StartDate" -Type DateTime -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "EndDate" -InternalName "EndDate" -Type DateTime -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "ProjectBudget" -InternalName "ProjectBudget" -Type Number -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "ProjectStatus" -InternalName "ProjectStatus" -Type Choice -Choices "Planning","Active","On Hold","Delayed","Completed","Cancelled" -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "Priority" -InternalName "Priority" -Type Choice -Choices "Low","Medium","High","Critical" -AddToDefaultView
Add-PnPField -List "Projects" -DisplayName "ProjectProgress" -InternalName "ProjectProgress" -Type Number -AddToDefaultView

# 2. ProjectTasks List
New-PnPList -Title "ProjectTasks" -Template GenericList -EnableVersioning
Add-PnPField -List "ProjectTasks" -DisplayName "TaskID" -InternalName "TaskID" -Type Text -Required -AddToDefaultView
Add-PnPField -List "ProjectTasks" -DisplayName "TaskDescription" -InternalName "TaskDescription" -Type Note
Add-PnPField -List "ProjectTasks" -DisplayName "AssignedTo" -InternalName "AssignedTo" -Type User -AddToDefaultView
Add-PnPField -List "ProjectTasks" -DisplayName "StartDate" -InternalName "StartDate" -Type DateTime -AddToDefaultView
Add-PnPField -List "ProjectTasks" -DisplayName "DueDate" -InternalName "DueDate" -Type DateTime -AddToDefaultView
Add-PnPField -List "ProjectTasks" -DisplayName "Priority" -InternalName "Priority" -Type Choice -Choices "Low","Medium","High","Critical" -AddToDefaultView
Add-PnPField -List "ProjectTasks" -DisplayName "TaskStatus" -InternalName "TaskStatus" -Type Choice -Choices "To Do","In Progress","Under Review","Completed" -AddToDefaultView
Add-PnPField -List "ProjectTasks" -DisplayName "CompletionPercentage" -InternalName "CompletionPercentage" -Type Number -AddToDefaultView

# 3. ProjectMilestones List
New-PnPList -Title "ProjectMilestones" -Template GenericList -EnableVersioning
Add-PnPField -List "ProjectMilestones" -DisplayName "DueDate" -InternalName "DueDate" -Type DateTime -AddToDefaultView
Add-PnPField -List "ProjectMilestones" -DisplayName "MilestoneStatus" -InternalName "MilestoneStatus" -Type Choice -Choices "Pending","In Progress","Completed" -AddToDefaultView
Add-PnPField -List "ProjectMilestones" -DisplayName "CompletedDate" -InternalName "CompletedDate" -Type DateTime

# 4. ProjectApprovals List
New-PnPList -Title "ProjectApprovals" -Template GenericList -EnableVersioning
Add-PnPField -List "ProjectApprovals" -DisplayName "ItemType" -InternalName "ItemType" -Type Choice -Choices "Project","Task" -AddToDefaultView
Add-PnPField -List "ProjectApprovals" -DisplayName "ItemIdRef" -InternalName "ItemIdRef" -Type Text
Add-PnPField -List "ProjectApprovals" -DisplayName "ItemTitle" -InternalName "ItemTitle" -Type Text -AddToDefaultView
Add-PnPField -List "ProjectApprovals" -DisplayName "RequestedBy" -InternalName "RequestedBy" -Type User -AddToDefaultView
Add-PnPField -List "ProjectApprovals" -DisplayName "Approver" -InternalName "Approver" -Type User -AddToDefaultView
Add-PnPField -List "ProjectApprovals" -DisplayName "ApprovalStatus" -InternalName "ApprovalStatus" -Type Choice -Choices "Pending","Approved","Rejected" -AddToDefaultView
Add-PnPField -List "ProjectApprovals" -DisplayName "SubmissionDate" -InternalName "SubmissionDate" -Type DateTime -AddToDefaultView
Add-PnPField -List "ProjectApprovals" -DisplayName "DecisionDate" -InternalName "DecisionDate" -Type DateTime
Add-PnPField -List "ProjectApprovals" -DisplayName "Comments" -InternalName "Comments" -Type Note

# 5. ProjectDocuments Library
New-PnPList -Title "ProjectDocuments" -Template DocumentLibrary -EnableVersioning
Add-PnPField -List "ProjectDocuments" -DisplayName "DocumentCategory" -InternalName "DocumentCategory" -Type Choice -Choices "Architecture","Design","Requirements","Contract","Deliverable","Meeting Notes","Other" -AddToDefaultView

Write-Host "All lists and document libraries created successfully!" -ForegroundColor Green
```
