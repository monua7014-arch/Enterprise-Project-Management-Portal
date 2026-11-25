import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService } from '../../services';
import { IProjectItem, IFinancialMetric } from '../../models';
import { INITIAL_FINANCIALS } from '../../services/MockData';
import { 
  PrimaryButton, 
  DefaultButton, 
  Modal, 
  TextField, 
  Dropdown, 
  IDropdownOption, 
  ProgressIndicator, 
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

export const ProjectFinancials: React.FC = () => {
  const { config, themeStyles, showToast, refreshTrigger, triggerRefresh } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [financials, setFinancials] = useState<IFinancialMetric[]>([...INITIAL_FINANCIALS]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);

  // Log Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expenseProjectId, setExpenseProjectId] = useState<number>(1);
  const [expenseAmount, setExpenseAmount] = useState<number>(12000);
  const [expenseCategory, setExpenseCategory] = useState<string>('Cloud Infrastructure');
  const [expenseNote, setExpenseNote] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [config, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pList = await ProjectService.getInstance().getProjects(config);
      setProjects(pList);
      if (pList.length > 0) setExpenseProjectId(pList[0].id);
    } catch (err) {
      console.error('[ProjectFinancials] Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogExpense = () => {
    if (expenseAmount <= 0) return;
    const project = projects.find(p => p.id === expenseProjectId);

    setFinancials(prev =>
      prev.map(f => {
        if (f.projectId === expenseProjectId) {
          const newAC = f.actualCost + expenseAmount;
          const newCV = f.earnedValue - newAC;
          const newCPI = Number((f.earnedValue / (newAC || 1)).toFixed(2));
          return {
            ...f,
            actualCost: newAC,
            costVariance: newCV,
            cpi: newCPI
          };
        }
        return f;
      })
    );

    showToast(`Logged $${expenseAmount.toLocaleString()} expense against '${project?.title}'.`, 'success');
    setIsExpenseModalOpen(false);
    setExpenseAmount(0);
    setExpenseNote('');
  };

  const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
  const totalActual = financials.reduce((acc, f) => acc + f.actualCost, 0);
  const totalEarned = financials.reduce((acc, f) => acc + f.earnedValue, 0);
  const portfolioCPI = (totalEarned / (totalActual || 1)).toFixed(2);

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
            Earned Value Management (EVM) & Budget Burn-Down
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Quantitative cost performance index (CPI), schedule performance index (SPI), and Estimate at Completion (EAC) forecasting.
          </div>
        </div>

        <PrimaryButton
          text="Log Project Expenditure"
          iconProps={{ iconName: 'Money' }}
          onClick={() => setIsExpenseModalOpen(true)}
          styles={{ root: { backgroundColor: themeStyles.accentGreen, borderColor: themeStyles.accentGreen, borderRadius: '6px' } }}
        />
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Total Allocated Budget</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.textPrimary, marginTop: '4px' }}>
            ${totalBudget.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Actual Incurred Cost (AC)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentAmber, marginTop: '4px' }}>
            ${totalActual.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: themeStyles.textSecondary }}>Earned Value Delivered (EV)</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentBlue, marginTop: '4px' }}>
            ${totalEarned.toLocaleString()}
          </div>
        </div>

        <div style={{ padding: '16px 20px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', color: Number(portfolioCPI) >= 1.0 ? themeStyles.accentGreen : themeStyles.accentRed, fontWeight: 600 }}>
            Portfolio Cost Efficiency (CPI)
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: Number(portfolioCPI) >= 1.0 ? themeStyles.accentGreen : themeStyles.accentRed, marginTop: '4px' }}>
            {portfolioCPI}x
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>
            {Number(portfolioCPI) >= 1.0 ? 'Operating under budget' : 'Cost overrun alert'}
          </div>
        </div>
      </div>

      {/* EVM Performance Table */}
      <div
        style={{
          padding: '24px',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflowX: 'auto'
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
          Project-by-Project EVM Financial Variance Matrix
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: themeStyles.bgCardHover, borderBottom: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary, fontWeight: 600 }}>
              <th style={{ padding: '12px 16px' }}>Project Title</th>
              <th style={{ padding: '12px 16px' }}>Planned Value (PV)</th>
              <th style={{ padding: '12px 16px' }}>Earned Value (EV)</th>
              <th style={{ padding: '12px 16px' }}>Actual Cost (AC)</th>
              <th style={{ padding: '12px 16px' }}>Cost Variance (CV)</th>
              <th style={{ padding: '12px 16px' }}>CPI Efficiency</th>
              <th style={{ padding: '12px 16px' }}>SPI Schedule</th>
              <th style={{ padding: '12px 16px' }}>Forecasted EAC</th>
            </tr>
          </thead>
          <tbody>
            {financials.map(f => {
              const isCostHealthy = f.costVariance >= 0;
              const isScheduleHealthy = f.scheduleVariance >= 0;

              return (
                <tr key={f.projectId} style={{ borderBottom: `1px solid ${themeStyles.border}` }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.textPrimary }}>
                    {f.projectTitle}
                  </td>
                  <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                    ${f.plannedValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: themeStyles.accentBlue }}>
                    ${f.earnedValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: themeStyles.textSecondary }}>
                    ${f.actualCost.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: isCostHealthy ? themeStyles.accentGreen : themeStyles.accentRed }}>
                    {isCostHealthy ? `+$${f.costVariance.toLocaleString()}` : `-$${Math.abs(f.costVariance).toLocaleString()}`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: f.cpi >= 1.0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: f.cpi >= 1.0 ? themeStyles.accentGreen : themeStyles.accentRed
                      }}
                    >
                      {f.cpi.toFixed(2)}x
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: f.spi >= 1.0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: f.spi >= 1.0 ? themeStyles.accentGreen : themeStyles.accentRed
                      }}
                    >
                      {f.spi.toFixed(2)}x
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: themeStyles.textPrimary }}>
                    ${Math.round(f.forecastedEAC).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onDismiss={() => setIsExpenseModalOpen(false)}
        styles={{
          main: {
            width: '500px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${themeStyles.border}` }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Log Project Expenditure
          </h3>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Dropdown
            label="Target Project"
            required
            selectedKey={expenseProjectId}
            options={projects.map(p => ({ key: p.id, text: p.title }))}
            onChange={(_, opt) => opt && setExpenseProjectId(Number(opt.key))}
          />

          <TextField
            label="Expenditure Amount ($ USD)"
            type="number"
            required
            value={String(expenseAmount)}
            onChange={(_, val) => setExpenseAmount(Number(val) || 0)}
          />

          <Dropdown
            label="Cost Category"
            selectedKey={expenseCategory}
            options={[
              { key: 'Labor', text: 'Labor & Engineering Hours' },
              { key: 'Cloud Infrastructure', text: 'Cloud Infrastructure & Azure Subscriptions' },
              { key: 'Software Licenses', text: 'Software Licenses & SaaS APIs' },
              { key: 'Consulting', text: 'External Security / Audit Consulting' },
              { key: 'Hardware', text: 'Hardware & Network Equipment' }
            ]}
            onChange={(_, opt) => opt && setExpenseCategory(String(opt.key))}
          />

          <TextField
            label="Invoice / PO Reference Note"
            placeholder="e.g. Azure Enterprise Agreement Q1 true-up invoice #EA-8902"
            value={expenseNote}
            onChange={(_, val) => setExpenseNote(val || '')}
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
          <DefaultButton text="Cancel" onClick={() => setIsExpenseModalOpen(false)} />
          <PrimaryButton
            text="Commit Expenditure"
            onClick={handleLogExpense}
            styles={{ root: { backgroundColor: themeStyles.accentGreen, borderColor: themeStyles.accentGreen } }}
          />
        </div>
      </Modal>
    </div>
  );
};
