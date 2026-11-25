import * as React from 'react';
import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ExcelService, ProjectService, IExcelProjectRow, IExcelValidationResult } from '../../services';
import { 
  PrimaryButton, 
  DefaultButton, 
  ProgressIndicator, 
  MessageBar, 
  MessageBarType,
  Pivot,
  PivotItem
} from '@fluentui/react';

export const ExcelBulkUpload: React.FC = () => {
  const { config, themeStyles, showToast, triggerRefresh, setActiveView } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsing, setParsing] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [validationResult, setValidationResult] = useState<IExcelValidationResult | null>(null);
  
  // Import state
  const [importing, setImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 });
  const [importSummary, setImportSummary] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    ExcelService.getInstance().downloadTemplate();
    showToast('Enterprise project template downloaded.', 'info');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setParsing(true);
    setImportSummary(null);

    try {
      const existingProjects = await ProjectService.getInstance().getProjects(config);
      const result = await ExcelService.getInstance().parseExcelFile(file, existingProjects);
      setValidationResult(result);
      showToast(`Analyzed ${result.totalRows} rows: ${result.validCount} valid, ${result.invalidCount} invalid.`, 'info');
    } catch (err: any) {
      console.error('[ExcelBulkUpload] Parse error:', err);
      showToast(`Failed to parse Excel file: ${err.message || 'Check file format'}`, 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleImportValidRecords = async () => {
    if (!validationResult || validationResult.validCount === 0) return;

    setImporting(true);
    setImportProgress({ processed: 0, total: validationResult.validCount });

    try {
      const res = await ExcelService.getInstance().importValidRows(
        validationResult.rows,
        config,
        (processed, total) => setImportProgress({ processed, total })
      );

      setImportSummary({ imported: res.importedCount, errors: res.errors });
      showToast(`Successfully imported ${res.importedCount} projects into SharePoint!`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(`Bulk import error: ${err.message}`, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!validationResult) return;
    ExcelService.getInstance().downloadErrorReport(validationResult.rows);
    showToast('Error report downloaded.', 'info');
  };

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
            Enterprise Excel Bulk Data Ingestion
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Upload `.xlsx` spreadsheets to validate schemas, detect duplicates, and safely batch-import projects into SharePoint.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <DefaultButton
            text="Download Excel Template"
            iconProps={{ iconName: 'Download' }}
            onClick={handleDownloadTemplate}
            styles={{ root: { borderRadius: '6px' } }}
          />
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: '40px 24px',
          backgroundColor: themeStyles.bgCard,
          border: `2px dashed ${themeStyles.border}`,
          borderRadius: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = themeStyles.accentBlue;
          e.currentTarget.style.backgroundColor = themeStyles.bgCardHover;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = themeStyles.border;
          e.currentTarget.style.backgroundColor = themeStyles.bgCard;
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx, .xls, .csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <i
          className="ms-Icon ms-Icon--ExcelDocument"
          style={{ fontSize: '48px', color: themeStyles.accentGreen, marginBottom: '12px', display: 'block' }}
        />
        <div style={{ fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
          {selectedFileName ? `Selected: ${selectedFileName}` : 'Click or Drag & Drop Excel File Here'}
        </div>
        <div style={{ fontSize: '12.5px', color: themeStyles.textMuted, marginTop: '6px' }}>
          Supports Microsoft Excel (.xlsx, .xls) and CSV files up to 10MB
        </div>
      </div>

      {/* Parsing Indicator */}
      {parsing && (
        <ProgressIndicator
          label="Reading and validating Excel rows against SharePoint schema..."
          styles={{ progressBar: { backgroundColor: themeStyles.accentBlue } }}
        />
      )}

      {/* Import Summary Notice */}
      {importSummary && (
        <MessageBar
          messageBarType={importSummary.errors.length === 0 ? MessageBarType.success : MessageBarType.warning}
          styles={{ root: { borderRadius: '8px' } }}
        >
          <strong>Import Complete:</strong> {importSummary.imported} projects successfully created in SharePoint.
          {importSummary.errors.length > 0 && ` (${importSummary.errors.length} failed).`}
          &nbsp;
          <button
            onClick={() => setActiveView('projects')}
            style={{
              background: 'none',
              border: 'none',
              color: themeStyles.accentBlue,
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            View Projects Portfolio &rarr;
          </button>
        </MessageBar>
      )}

      {/* Validation Results Metrics & Action Bar */}
      {validationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '14px'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: themeStyles.bgCard,
                border: `1px solid ${themeStyles.border}`,
                borderRadius: '10px'
              }}
            >
              <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Total Spreadsheet Rows</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.textPrimary, marginTop: '4px' }}>
                {validationResult.totalRows}
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                backgroundColor: themeStyles.bgCard,
                border: `1px solid ${themeStyles.border}`,
                borderRadius: '10px'
              }}
            >
              <div style={{ fontSize: '12px', color: themeStyles.accentGreen, fontWeight: 600 }}>Valid Records</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentGreen, marginTop: '4px' }}>
                {validationResult.validCount}
              </div>
            </div>

            <div
              style={{
                padding: '16px 20px',
                backgroundColor: themeStyles.bgCard,
                border: `1px solid ${themeStyles.border}`,
                borderRadius: '10px'
              }}
            >
              <div style={{ fontSize: '12px', color: themeStyles.accentRed, fontWeight: 600 }}>Invalid / Errors</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentRed, marginTop: '4px' }}>
                {validationResult.invalidCount}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <PrimaryButton
                text={importing ? 'Importing...' : `Import ${validationResult.validCount} Valid Records`}
                iconProps={{ iconName: 'CloudUpload' }}
                disabled={validationResult.validCount === 0 || importing}
                onClick={handleImportValidRecords}
                styles={{ root: { backgroundColor: themeStyles.accentBlue, borderRadius: '6px' } }}
              />
              {validationResult.invalidCount > 0 && (
                <DefaultButton
                  text="Download Error Report (.xlsx)"
                  iconProps={{ iconName: 'ErrorBadge' }}
                  onClick={handleDownloadErrors}
                  styles={{ root: { borderRadius: '6px' } }}
                />
              )}
            </div>
          </div>

          {/* Import Progress Bar */}
          {importing && (
            <ProgressIndicator
              label={`Batch importing projects to SharePoint (${importProgress.processed} of ${importProgress.total})...`}
              percentComplete={importProgress.total > 0 ? importProgress.processed / importProgress.total : 0}
              styles={{ progressBar: { backgroundColor: themeStyles.accentBlue } }}
            />
          )}

          {/* Validation Data Grid Table */}
          <div
            style={{
              padding: '20px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              borderRadius: '12px'
            }}
          >
            <Pivot aria-label="Validation Tabs">
              {/* Tab 1: All Rows */}
              <PivotItem headerText={`All Rows (${validationResult.totalRows})`}>
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  {renderRowsTable(validationResult.rows, themeStyles)}
                </div>
              </PivotItem>

              {/* Tab 2: Valid Rows */}
              <PivotItem headerText={`Valid Records (${validationResult.validCount})`}>
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  {renderRowsTable(validationResult.rows.filter(r => r.isValid), themeStyles)}
                </div>
              </PivotItem>

              {/* Tab 3: Invalid Rows */}
              <PivotItem headerText={`Invalid Records (${validationResult.invalidCount})`}>
                <div style={{ marginTop: '14px', overflowX: 'auto' }}>
                  {renderRowsTable(validationResult.rows.filter(r => !r.isValid), themeStyles)}
                </div>
              </PivotItem>
            </Pivot>
          </div>
        </div>
      )}
    </div>
  );
};

const renderRowsTable = (rows: IExcelProjectRow[], themeStyles: any) => {
  if (rows.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted }}>
        No rows match this filter.
      </div>
    );
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
      <thead>
        <tr
          style={{
            backgroundColor: themeStyles.bgCardHover,
            borderBottom: `1px solid ${themeStyles.border}`,
            color: themeStyles.textSecondary,
            fontWeight: 600
          }}
        >
          <th style={{ padding: '10px 14px' }}>Row</th>
          <th style={{ padding: '10px 14px' }}>Status</th>
          <th style={{ padding: '10px 14px' }}>Project ID</th>
          <th style={{ padding: '10px 14px' }}>Project Name</th>
          <th style={{ padding: '10px 14px' }}>Client</th>
          <th style={{ padding: '10px 14px' }}>Budget</th>
          <th style={{ padding: '10px 14px' }}>Priority</th>
          <th style={{ padding: '10px 14px' }}>Validation Details</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr
            key={r.rowNumber}
            style={{
              borderBottom: `1px solid ${themeStyles.border}`,
              backgroundColor: r.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.05)'
            }}
          >
            <td style={{ padding: '10px 14px', fontWeight: 600, color: themeStyles.textMuted }}>
              #{r.rowNumber}
            </td>
            <td style={{ padding: '10px 14px' }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: r.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: r.isValid ? themeStyles.accentGreen : themeStyles.accentRed
                }}
              >
                {r.isValid ? 'VALID' : 'INVALID'}
              </span>
            </td>
            <td style={{ padding: '10px 14px', fontWeight: 600, color: themeStyles.textPrimary }}>
              {r.ProjectID || '—'}
            </td>
            <td style={{ padding: '10px 14px', fontWeight: 500, color: themeStyles.textPrimary }}>
              {r.ProjectName || '—'}
            </td>
            <td style={{ padding: '10px 14px', color: themeStyles.textSecondary }}>
              {r.ClientName || '—'}
            </td>
            <td style={{ padding: '10px 14px', color: themeStyles.textSecondary }}>
              ${Number(r.Budget).toLocaleString()}
            </td>
            <td style={{ padding: '10px 14px', color: themeStyles.textSecondary }}>
              {r.Priority || '—'}
            </td>
            <td style={{ padding: '10px 14px' }}>
              {r.isValid ? (
                <span style={{ color: themeStyles.accentGreen, fontSize: '11px' }}>
                  Ready for SharePoint import
                </span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {r.errors.map((err, i) => (
                    <span key={i} style={{ color: themeStyles.accentRed, fontSize: '11px' }}>
                      • {err}
                    </span>
                  ))}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
