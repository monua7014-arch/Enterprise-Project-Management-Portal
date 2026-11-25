import * as XLSX from 'xlsx';
import { IProjectItem, IListMappingConfig, ProjectStatus, PriorityLevel } from '../models';
import { ProjectService } from './ProjectService';

export interface IExcelProjectRow {
  rowNumber: number;
  ProjectID: string;
  ProjectName: string;
  Description: string;
  ClientName: string;
  StartDate: string;
  EndDate: string;
  Budget: number | string;
  Status: string;
  Priority: string;
  ProjectManagerEmail: string;
  isValid: boolean;
  errors: string[];
}

export interface IExcelValidationResult {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  rows: IExcelProjectRow[];
}

export class ExcelService {
  private static instance: ExcelService;

  private constructor() {}

  public static getInstance(): ExcelService {
    if (!ExcelService.instance) {
      ExcelService.instance = new ExcelService();
    }
    return ExcelService.instance;
  }

  public downloadTemplate(): void {
    const templateData = [
      {
        ProjectID: 'PRJ-2026-101',
        ProjectName: 'Global API Gateway Modernization',
        Description: 'Consolidate external client endpoints into Azure API Management with OAuth2.',
        ClientName: 'Northwind Traders',
        StartDate: '2026-04-01',
        EndDate: '2026-09-30',
        Budget: 275000,
        Status: 'Planning',
        Priority: 'High',
        ProjectManagerEmail: 'pm@tenant.com'
      },
      {
        ProjectID: 'PRJ-2026-102',
        ProjectName: 'HR Self-Service AI Chatbot',
        Description: 'Deploy conversational bot for leave balance and health policy inquiries.',
        ClientName: 'Internal Enterprise HR',
        StartDate: '2026-05-15',
        EndDate: '2026-10-15',
        Budget: 140000,
        Status: 'Planning',
        Priority: 'Medium',
        ProjectManagerEmail: 'lead@tenant.com'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProjectTemplate');
    XLSX.writeFile(workbook, 'Enterprise_Projects_Bulk_Template.xlsx');
  }

  public async parseExcelFile(file: File, existingProjects: IProjectItem[]): Promise<IExcelValidationResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          const existingIds = new Set(existingProjects.map(p => p.projectId.toLowerCase()));
          const seenInFileIds = new Set<string>();

          const rows: IExcelProjectRow[] = rawRows.map((r, idx) => {
            const rowNumber = idx + 2; // +1 for 0-index, +1 for header
            const errors: string[] = [];

            const pId = String(r.ProjectID || '').trim();
            const pName = String(r.ProjectName || r.Title || '').trim();
            const client = String(r.ClientName || '').trim();
            const desc = String(r.Description || '').trim();
            const startDate = String(r.StartDate || '').trim();
            const endDate = String(r.EndDate || '').trim();
            const budgetVal = Number(r.Budget);
            const status = String(r.Status || 'Planning').trim();
            const priority = String(r.Priority || 'Medium').trim();
            const pmEmail = String(r.ProjectManagerEmail || '').trim();

            if (!pId) errors.push('ProjectID is required.');
            else {
              if (existingIds.has(pId.toLowerCase())) {
                errors.push(`ProjectID '${pId}' already exists in SharePoint.`);
              }
              if (seenInFileIds.has(pId.toLowerCase())) {
                errors.push(`Duplicate ProjectID '${pId}' within this Excel sheet.`);
              }
              seenInFileIds.add(pId.toLowerCase());
            }

            if (!pName) errors.push('ProjectName is required.');
            if (!client) errors.push('ClientName is required.');
            if (isNaN(budgetVal) || budgetVal < 0) errors.push('Budget must be a non-negative number.');

            const validStatuses = ['Planning', 'Active', 'On Hold', 'Delayed', 'Completed', 'Cancelled'];
            if (!validStatuses.some(s => s.toLowerCase() === status.toLowerCase())) {
              errors.push(`Status must be one of: ${validStatuses.join(', ')}.`);
            }

            const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
            if (!validPriorities.some(p => p.toLowerCase() === priority.toLowerCase())) {
              errors.push(`Priority must be one of: ${validPriorities.join(', ')}.`);
            }

            if (startDate && isNaN(Date.parse(startDate))) errors.push('StartDate is not a valid date.');
            if (endDate && isNaN(Date.parse(endDate))) errors.push('EndDate is not a valid date.');
            if (startDate && endDate && Date.parse(startDate) > Date.parse(endDate)) {
              errors.push('StartDate cannot be later than EndDate.');
            }

            return {
              rowNumber,
              ProjectID: pId,
              ProjectName: pName,
              Description: desc,
              ClientName: client,
              StartDate: startDate || new Date().toISOString().split('T')[0],
              EndDate: endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
              Budget: isNaN(budgetVal) ? 0 : budgetVal,
              Status: status,
              Priority: priority,
              ProjectManagerEmail: pmEmail,
              isValid: errors.length === 0,
              errors
            };
          });

          const validCount = rows.filter(r => r.isValid).length;
          resolve({
            totalRows: rows.length,
            validCount,
            invalidCount: rows.length - validCount,
            rows
          });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  public async importValidRows(
    rows: IExcelProjectRow[],
    config: IListMappingConfig,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{ importedCount: number; errors: string[] }> {
    const validRows = rows.filter(r => r.isValid);
    const projectService = ProjectService.getInstance();
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        await projectService.createProject(
          {
            projectId: row.ProjectID,
            title: row.ProjectName,
            description: row.Description,
            clientName: row.ClientName,
            projectManager: row.ProjectManagerEmail
              ? { id: 0, title: row.ProjectManagerEmail.split('@')[0], email: row.ProjectManagerEmail }
              : null,
            startDate: new Date(row.StartDate).toISOString(),
            endDate: new Date(row.EndDate).toISOString(),
            budget: Number(row.Budget) || 0,
            status: row.Status as ProjectStatus,
            priority: row.Priority as PriorityLevel,
            progress: 0,
            assignedTeam: []
          },
          config
        );
        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${row.rowNumber} (${row.ProjectID}): ${err.message || 'Import failed'}`);
      }

      if (onProgress) {
        onProgress(i + 1, validRows.length);
      }
    }

    return { importedCount, errors };
  }

  public downloadErrorReport(rows: IExcelProjectRow[]): void {
    const errorRows = rows
      .filter(r => !r.isValid)
      .map(r => ({
        Row: r.rowNumber,
        ProjectID: r.ProjectID,
        ProjectName: r.ProjectName,
        Errors: r.errors.join('; '),
        ClientName: r.ClientName,
        Budget: r.Budget,
        Status: r.Status,
        Priority: r.Priority
      }));

    const worksheet = XLSX.utils.json_to_sheet(errorRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ImportErrors');
    XLSX.writeFile(workbook, 'Project_Bulk_Import_Errors.xlsx');
  }
}
