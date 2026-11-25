# Enterprise Project & Workflow Management Portal (SPFx)

An enterprise-grade, modern SaaS-style Project & Workflow Management Portal built on the **SharePoint Framework (SPFx)** with **React 17**, **TypeScript 4.7**, **Fluent UI**, **PnPjs v3**, and **Power Automate**.

---

## 🌟 Solution Highlights

- **Executive Project Dashboard**: Real-time KPI summary cards, project status distribution charts, task priority breakdown, upcoming milestone deadlines, and SharePoint activity logs.
- **Project Portfolio Management**: Full CRUD operations, budget tracking, multi-manager assignments, pagination, search, column sorting, and milestone management.
- **Task Management & Interactive Kanban Board**: Dual-view work breakdown (Table List & Kanban Board) with native HTML5 drag-and-drop state transitions synchronized with SharePoint.
- **Excel Bulk Upload & Validation Engine**: Drag-and-drop Excel ingestion, schema validation, duplicate detection, row-level error reporting, download template, and batch commit to SharePoint.
- **Document Management**: Project-linked SharePoint document library integration with category tagging, version tracking, and instant download/preview.
- **Governance & Approval Hub**: Submit project/task change requests, approval decisions with audit comments, and Power Automate webhook integration.
- **Resource Allocation & Team Capacity**: Project squad assignments, role categorization, and capacity allocation tracking.
- **Reports & Analytics**: Tabular and graphical summaries with formatted **Excel (.xlsx)** export and print-ready PDF views.
- **Dynamic Schema Discovery & Configuration**: Discovers SharePoint lists and fields dynamically—eliminating hardcoded list and internal column name dependencies.
- **Theme Support**: Professional Dark Navy & Blue SaaS theme with instant toggle to crisp Light mode.

---

## 💻 Tech Stack & Compatible Versions

| Component | Version | Role |
| :--- | :--- | :--- |
| **SharePoint Framework** | `1.18.2` | Core SPFx Runtime |
| **Node.js** | `v18.18.2` | Execution Environment (`>=18.17.1 <19.0.0`) |
| **React & React-DOM** | `17.0.1` | UI Library |
| **TypeScript** | `4.7.4` | Static Type Checker (`rush-stack-compiler-4.7`) |
| **Fluent UI** | `^8.106.4` | Microsoft 365 Design System |
| **PnPjs** | `^3.20.0` | Fluent SharePoint Online REST API Client |
| **SheetJS (xlsx)** | `^0.18.5` | Client-Side Excel Parse, Validation & Export |
| **Power Automate** | Cloud Flow HTTP | Automated Email & Teams Governance Workflow |

---

## 📁 Solution Architecture

```
enterprise-project-portal/
├── config/                         # SPFx build, bundle, and package manifests
│   ├── config.json
│   ├── package-solution.json
│   └── serve.json
├── docs/                           # Documentation and provisioning guides
│   ├── SharePoint-Setup-Guide.md   # Complete SharePoint list schemas & PnP script
│   ├── PowerAutomate-Integration-Guide.md
│   └── Testing-Checklist.md
├── src/
│   ├── components/                 # Modern React UI Components
│   │   ├── Navigation/             # Collapsible Sidebar & Header with Notifications
│   │   ├── Dashboard/              # Executive KPI Dashboard & Analytical Charts
│   │   ├── Projects/               # Project Portfolio List, Modal, & Detail Views
│   │   ├── Tasks/                  # Task Manager & Interactive Kanban Board
│   │   ├── ExcelUpload/            # Bulk Ingestion, Validation Engine & Error Grid
│   │   ├── Documents/              # SharePoint Document Library Browser
│   │   ├── Approvals/              # Governance & Multi-Step Review Center
│   │   ├── Team/                   # Squad Resource Allocation & Capacity
│   │   ├── Reports/                # Analytics & Multi-format Export
│   │   ├── Settings/               # Dynamic List & Field Schema Discovery
│   │   └── App.tsx                 # Root Portal Container & Theme Provider
│   ├── context/                    # AppContext (User, Theme, Navigation, Config)
│   ├── models/                     # TypeScript Interfaces & Domain Definitions
│   ├── services/                   # SharePoint & Domain Service Layer (PnPjs v3)
│   ├── styles/                     # Dark Navy & SaaS Light Themes
│   └── webparts/                   # SPFx WebPart Entrypoint
├── gulpfile.js                     # Gulp Build Pipeline
├── package.json                    # Dependencies & Scripts
└── tsconfig.json                   # TypeScript Compiler Configuration
```

---

## 🚀 Getting Started

### 1. Local Workbench Development
To serve the portal in your local SharePoint workbench:
```bash
gulp serve
```
Navigate to your tenant's hosted workbench:
`https://yourtenant.sharepoint.com/sites/YourSite/_layouts/workbench.aspx`

### 2. SharePoint List Setup
The portal works out of the box with sample mock data, and automatically connects to live SharePoint lists when created. To provision the lists on your SharePoint Online site, refer to:
- [SharePoint Setup Guide](docs/SharePoint-Setup-Guide.md) for list schemas and PnP PowerShell automated script.

### 3. Production Package Generation
To compile and package the solution for the SharePoint App Catalog:
```bash
# 1. Clean and build release bundle
gulp clean
gulp bundle --ship

# 2. Package solution (.sppkg)
gulp package-solution --ship
```
The resulting package will be generated at:
`sharepoint/solution/enterprise-project-portal.sppkg`

Upload this package to your **SharePoint App Catalog** (`Manage Apps`), check **Enable this app and add to all sites**, and add the **Enterprise Project & Workflow Portal** web part to any modern page.
