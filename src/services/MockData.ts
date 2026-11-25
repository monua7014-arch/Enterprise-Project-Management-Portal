import { 
  IProjectItem, 
  ITaskItem, 
  IMilestoneItem, 
  IApprovalItem, 
  IDocumentItem, 
  ITeamMemberItem, 
  IActivityLogItem 
} from '../models';

export const INITIAL_PROJECTS: IProjectItem[] = [
  {
    id: 1,
    projectId: 'PRJ-2026-001',
    title: 'Cloud Core Infrastructure Modernization',
    description: 'Migration of legacy on-premises ERP and CRM database clusters to Microsoft Azure with microservices architecture.',
    clientName: 'Contoso Global Logistics',
    projectManager: {
      id: 11,
      title: 'Sarah Jenkins',
      email: 'sjenkins@contoso.com',
      jobTitle: 'Principal Cloud Architect'
    },
    startDate: '2026-01-10T00:00:00Z',
    endDate: '2026-07-30T00:00:00Z',
    budget: 450000,
    status: 'Active',
    priority: 'Critical',
    progress: 68,
    assignedTeam: [
      { id: 11, title: 'Sarah Jenkins', email: 'sjenkins@contoso.com' },
      { id: 12, title: 'Alex Vance', email: 'avance@contoso.com' },
      { id: 13, title: 'Priya Sharma', email: 'psharma@contoso.com' },
      { id: 14, title: 'Marcus Lee', email: 'mlee@contoso.com' }
    ]
  },
  {
    id: 2,
    projectId: 'PRJ-2026-002',
    title: 'Customer Experience AI Portal',
    description: 'Generative AI customer support copilot integrated with Microsoft 365, Teams bots, and SharePoint knowledge bases.',
    clientName: 'Northwind Health Networks',
    projectManager: {
      id: 15,
      title: 'David Miller',
      email: 'dmiller@northwind.com',
      jobTitle: 'AI Solutions Director'
    },
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-08-15T00:00:00Z',
    budget: 320000,
    status: 'Active',
    priority: 'High',
    progress: 42,
    assignedTeam: [
      { id: 15, title: 'David Miller', email: 'dmiller@northwind.com' },
      { id: 16, title: 'Elena Rostova', email: 'erostova@northwind.com' },
      { id: 17, title: 'James Wu', email: 'jwu@northwind.com' }
    ]
  },
  {
    id: 3,
    projectId: 'PRJ-2026-003',
    title: 'Global Supply Chain Analytics Suite',
    description: 'Real-time telemetry and supply chain forecasting dashboard built with Power BI Embedded and React frontend.',
    clientName: 'Fabrikam Manufacturing',
    projectManager: {
      id: 18,
      title: 'Rachel Green',
      email: 'rgreen@fabrikam.com',
      jobTitle: 'Operations Lead'
    },
    startDate: '2025-11-01T00:00:00Z',
    endDate: '2026-04-10T00:00:00Z',
    budget: 280000,
    status: 'Delayed',
    priority: 'High',
    progress: 84,
    assignedTeam: [
      { id: 18, title: 'Rachel Green', email: 'rgreen@fabrikam.com' },
      { id: 19, title: 'Carlos Gomez', email: 'cgomez@fabrikam.com' }
    ]
  },
  {
    id: 4,
    projectId: 'PRJ-2026-004',
    title: 'Enterprise Cyber Security Compliance Framework',
    description: 'Zero Trust architecture audit, automated compliance reporting, and ISO 27001 readiness review.',
    clientName: 'Woodgrove Financial Services',
    projectManager: {
      id: 20,
      title: 'Michael Chang',
      email: 'mchang@woodgrove.com',
      jobTitle: 'CISO Advisor'
    },
    startDate: '2025-08-15T00:00:00Z',
    endDate: '2026-02-28T00:00:00Z',
    budget: 195000,
    status: 'Completed',
    priority: 'Medium',
    progress: 100,
    assignedTeam: [
      { id: 20, title: 'Michael Chang', email: 'mchang@woodgrove.com' },
      { id: 21, title: 'Alicia Scott', email: 'ascott@woodgrove.com' }
    ]
  },
  {
    id: 5,
    projectId: 'PRJ-2026-005',
    title: 'NextGen Mobile Banking App Redesign',
    description: 'Full UX overhaul, biometric security integration, and instant international wire transfer module.',
    clientName: 'Alpine Bank International',
    projectManager: {
      id: 22,
      title: 'Sophia Martinez',
      email: 'smartinez@alpinebank.com',
      jobTitle: 'Head of Digital Products'
    },
    startDate: '2026-03-01T00:00:00Z',
    endDate: '2026-11-30T00:00:00Z',
    budget: 520000,
    status: 'Planning',
    priority: 'Critical',
    progress: 15,
    assignedTeam: [
      { id: 22, title: 'Sophia Martinez', email: 'smartinez@alpinebank.com' },
      { id: 23, title: 'Kenji Sato', email: 'ksato@alpinebank.com' }
    ]
  }
];

export const INITIAL_TASKS: ITaskItem[] = [
  {
    id: 101,
    taskId: 'TSK-101',
    projectId: 1,
    projectTitle: 'Cloud Core Infrastructure Modernization',
    title: 'Finalize Kubernetes Cluster Networking & Ingress Controllers',
    description: 'Deploy Traefik Ingress controllers and establish mutual TLS policies across AKS node pools.',
    assignedTo: { id: 12, title: 'Alex Vance', email: 'avance@contoso.com' },
    startDate: '2026-03-01T00:00:00Z',
    dueDate: '2026-03-25T00:00:00Z',
    priority: 'Critical',
    status: 'In Progress',
    completionPercentage: 75
  },
  {
    id: 102,
    taskId: 'TSK-102',
    projectId: 1,
    projectTitle: 'Cloud Core Infrastructure Modernization',
    title: 'Execute Database Failover Drill & Verify Replication Lag',
    description: 'Perform dry-run database cutover drill across primary and secondary Azure regions.',
    assignedTo: { id: 13, title: 'Priya Sharma', email: 'psharma@contoso.com' },
    startDate: '2026-03-10T00:00:00Z',
    dueDate: '2026-03-30T00:00:00Z',
    priority: 'High',
    status: 'To Do',
    completionPercentage: 20
  },
  {
    id: 103,
    taskId: 'TSK-103',
    projectId: 1,
    projectTitle: 'Cloud Core Infrastructure Modernization',
    title: 'Infrastructure Security & IAM Role Assignment Review',
    description: 'Validate least-privilege RBAC role bindings across Azure subscription groups.',
    assignedTo: { id: 14, title: 'Marcus Lee', email: 'mlee@contoso.com' },
    startDate: '2026-02-15T00:00:00Z',
    dueDate: '2026-03-15T00:00:00Z',
    priority: 'Medium',
    status: 'Completed',
    completionPercentage: 100
  },
  {
    id: 104,
    taskId: 'TSK-104',
    projectId: 2,
    projectTitle: 'Customer Experience AI Portal',
    title: 'Train Custom RAG Model on Technical Documentation',
    description: 'Index SharePoint document libraries using Azure OpenAI embeddings vector search.',
    assignedTo: { id: 16, title: 'Elena Rostova', email: 'erostova@northwind.com' },
    startDate: '2026-03-05T00:00:00Z',
    dueDate: '2026-04-05T00:00:00Z',
    priority: 'High',
    status: 'In Progress',
    completionPercentage: 55
  },
  {
    id: 105,
    taskId: 'TSK-105',
    projectId: 2,
    projectTitle: 'Customer Experience AI Portal',
    title: 'Design Teams Bot Adaptive Cards and Dialog Prompts',
    description: 'Create interactive Adaptive Cards for conversational approval workflows and query prompts.',
    assignedTo: { id: 17, title: 'James Wu', email: 'jwu@northwind.com' },
    startDate: '2026-03-12T00:00:00Z',
    dueDate: '2026-04-10T00:00:00Z',
    priority: 'Medium',
    status: 'Under Review',
    completionPercentage: 90
  },
  {
    id: 106,
    taskId: 'TSK-106',
    projectId: 3,
    projectTitle: 'Global Supply Chain Analytics Suite',
    title: 'Resolve Telemetry Pipeline Gateway Latency Bottleneck',
    description: 'Investigate message queuing delays in Kafka broker during peak shipping container scans.',
    assignedTo: { id: 19, title: 'Carlos Gomez', email: 'cgomez@fabrikam.com' },
    startDate: '2026-02-20T00:00:00Z',
    dueDate: '2026-03-10T00:00:00Z', // Overdue
    priority: 'Critical',
    status: 'In Progress',
    completionPercentage: 60
  },
  {
    id: 107,
    taskId: 'TSK-107',
    projectId: 5,
    projectTitle: 'NextGen Mobile Banking App Redesign',
    title: 'Produce High-Fidelity Figma Wireframes & User Journey Maps',
    description: 'Design dark/light theme screens for biometric login and wire transfer approval modal.',
    assignedTo: { id: 23, title: 'Kenji Sato', email: 'ksato@alpinebank.com' },
    startDate: '2026-03-01T00:00:00Z',
    dueDate: '2026-03-28T00:00:00Z',
    priority: 'High',
    status: 'To Do',
    completionPercentage: 35
  }
];

export const INITIAL_MILESTONES: IMilestoneItem[] = [
  {
    id: 201,
    projectId: 1,
    title: 'Architecture Blueprint & Landing Zone Provisioning',
    dueDate: '2026-02-28T00:00:00Z',
    status: 'Completed',
    completedDate: '2026-02-25T00:00:00Z'
  },
  {
    id: 202,
    projectId: 1,
    title: 'Core Database Migration & Synchronization',
    dueDate: '2026-04-15T00:00:00Z',
    status: 'In Progress'
  },
  {
    id: 203,
    projectId: 1,
    title: 'Production Cutover & Disaster Recovery Validation',
    dueDate: '2026-07-15T00:00:00Z',
    status: 'Pending'
  },
  {
    id: 204,
    projectId: 2,
    title: 'Vector Knowledge Base Indexing Complete',
    dueDate: '2026-04-30T00:00:00Z',
    status: 'In Progress'
  },
  {
    id: 205,
    projectId: 3,
    title: 'Real-time Telemetry Pipeline Integration',
    dueDate: '2026-03-05T00:00:00Z',
    status: 'In Progress'
  }
];

export const INITIAL_APPROVALS: IApprovalItem[] = [
  {
    id: 301,
    itemType: 'Project',
    itemId: 5,
    itemTitle: 'NextGen Mobile Banking App Redesign - Budget Scope Change',
    requestedBy: { id: 22, title: 'Sophia Martinez', email: 'smartinez@alpinebank.com' },
    approver: { id: 11, title: 'Executive Committee', email: 'approvals@tenant.com' },
    status: 'Pending',
    submissionDate: '2026-03-18T14:30:00Z',
    comments: 'Requesting additional $45,000 contingency allocation for third-party penetration testing.'
  },
  {
    id: 302,
    itemType: 'Task',
    itemId: 105,
    itemTitle: 'Design Teams Bot Adaptive Cards and Dialog Prompts',
    requestedBy: { id: 17, title: 'James Wu', email: 'jwu@northwind.com' },
    approver: { id: 15, title: 'David Miller', email: 'dmiller@northwind.com' },
    status: 'Pending',
    submissionDate: '2026-03-19T09:15:00Z',
    comments: 'UX specifications ready for review and stakeholder approval.'
  },
  {
    id: 303,
    itemType: 'Project',
    itemId: 4,
    itemTitle: 'Enterprise Cyber Security Compliance Framework - Sign-off',
    requestedBy: { id: 20, title: 'Michael Chang', email: 'mchang@woodgrove.com' },
    approver: { id: 11, title: 'Board of Directors', email: 'board@woodgrove.com' },
    status: 'Approved',
    submissionDate: '2026-02-20T11:00:00Z',
    decisionDate: '2026-02-26T16:00:00Z',
    comments: 'Full compliance certification achieved with zero audit findings.'
  }
];

export const INITIAL_DOCUMENTS: IDocumentItem[] = [
  {
    id: 401,
    name: 'Cloud-Architecture-Design-Document-v2.pdf',
    title: 'Cloud Architecture Design Document v2',
    serverRelativeUrl: '/sites/projects/ProjectDocuments/Cloud-Architecture-Design-Document-v2.pdf',
    fileSize: 3450000,
    modified: '2026-03-15T10:20:00Z',
    author: 'Sarah Jenkins',
    projectId: 1,
    projectTitle: 'Cloud Core Infrastructure Modernization',
    category: 'Architecture',
    versionLabel: '2.1'
  },
  {
    id: 402,
    name: 'RAG-AI-Prompt-Engineering-Guidelines.docx',
    title: 'RAG AI Prompt Engineering & Compliance Guidelines',
    serverRelativeUrl: '/sites/projects/ProjectDocuments/RAG-AI-Prompt-Engineering-Guidelines.docx',
    fileSize: 1240000,
    modified: '2026-03-18T14:45:00Z',
    author: 'Elena Rostova',
    projectId: 2,
    projectTitle: 'Customer Experience AI Portal',
    category: 'Design',
    versionLabel: '1.4'
  },
  {
    id: 403,
    name: 'Supply-Chain-Telemetry-SLA-Agreement.pdf',
    title: 'Supply Chain Telemetry SLA & Operational Contract',
    serverRelativeUrl: '/sites/projects/ProjectDocuments/Supply-Chain-Telemetry-SLA-Agreement.pdf',
    fileSize: 890000,
    modified: '2026-02-28T09:10:00Z',
    author: 'Rachel Green',
    projectId: 3,
    projectTitle: 'Global Supply Chain Analytics Suite',
    category: 'Contract',
    versionLabel: '1.0'
  }
];

export const INITIAL_TEAM_MEMBERS: ITeamMemberItem[] = [
  { id: 501, projectId: 1, user: { id: 11, title: 'Sarah Jenkins', email: 'sjenkins@contoso.com' }, role: 'Project Manager', allocationPercentage: 100, assignedDate: '2026-01-10T00:00:00Z' },
  { id: 502, projectId: 1, user: { id: 12, title: 'Alex Vance', email: 'avance@contoso.com' }, role: 'Technical Lead', allocationPercentage: 100, assignedDate: '2026-01-12T00:00:00Z' },
  { id: 503, projectId: 1, user: { id: 13, title: 'Priya Sharma', email: 'psharma@contoso.com' }, role: 'Senior Developer', allocationPercentage: 80, assignedDate: '2026-01-15T00:00:00Z' },
  { id: 504, projectId: 2, user: { id: 15, title: 'David Miller', email: 'dmiller@northwind.com' }, role: 'Project Manager', allocationPercentage: 50, assignedDate: '2026-02-01T00:00:00Z' },
  { id: 505, projectId: 2, user: { id: 16, title: 'Elena Rostova', email: 'erostova@northwind.com' }, role: 'Senior Developer', allocationPercentage: 100, assignedDate: '2026-02-05T00:00:00Z' }
];

export const INITIAL_ACTIVITY_LOGS: IActivityLogItem[] = [
  { id: 601, projectId: 1, action: 'Progress Updated', details: 'Project milestone reached: 68% progress verified.', performedBy: 'Sarah Jenkins', timestamp: '2026-03-21T08:30:00Z' },
  { id: 602, projectId: 2, taskId: 105, action: 'Submitted for Approval', details: 'Teams Bot Adaptive Cards submitted for lead review.', performedBy: 'James Wu', timestamp: '2026-03-20T16:15:00Z' },
  { id: 603, projectId: 3, taskId: 106, action: 'Overdue Notice', details: 'Task passed due date: Telemetry Pipeline Latency.', performedBy: 'System Automation', timestamp: '2026-03-11T00:00:00Z' },
  { id: 604, projectId: 4, action: 'Project Completed', details: 'Woodgrove Cyber Security project officially delivered.', performedBy: 'Michael Chang', timestamp: '2026-02-28T17:00:00Z' }
];
