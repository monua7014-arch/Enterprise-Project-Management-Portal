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
  Spinner, 
  SpinnerSize 
} from '@fluentui/react';

export const ProjectFinancials: React.FC = () => {
  const { config, themeStyles, currentTheme, showToast, refreshTrigger } = useApp();
  const isDark = currentTheme === 'dark';

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

  const totalPlanned = financials.reduce((acc, f) => acc + f.plannedValue, 0);
  const totalActual = financials.reduce((acc, f) => acc + f.actualCost, 0);
  const totalEarned = financials.reduce((acc, f) => acc + f.earnedValue, 0);
  const portfolioCPI = Number((totalEarned / (totalActual || 1)).toFixed(2));
  const portfolioSPI = Number((totalEarned / (totalPlanned || 1)).toFixed(2));

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
          borderRadius: '12px',
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: themeStyles.textPrimary }}>
            Earned Value Management (EVM) & Budget Burn-Down
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            Mathematical cost variance, schedule performance indexes (CPI/SPI), and EAC forecasting
          </div>
        </div>

        <PrimaryButton
          text="Log Direct Expense"
          iconProps={{ iconName: 'Money' }}
          onClick={() => setIsExpenseModalOpen(true)}
          styles={{
            root: {
              backgroundColor: themeStyles.accentBlue,
              borderRadius: '8px',
              height: '36px',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
            }
          }}
        />
      </div>

      {/* EVM Performance KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px'
        }}
      >
        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, boxShadow: themeStyles.cardShadow }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, letterSpacing: '0.4px' }}>PLANNED VALUE (PV)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: themeStyles.accentBlue, margin: '10px 0 4px 0' }}>
            ${totalPlanned.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Baseline authorized budget</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, boxShadow: themeStyles.cardShadow }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, letterSpacing: '0.4px' }}>EARNED VALUE (EV)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', margin: '10px 0 4px 0' }}>
            ${totalEarned.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Value of completed delivery</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, boxShadow: themeStyles.cardShadow }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, letterSpacing: '0.4px' }}>ACTUAL COST (AC)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#a855f7', margin: '10px 0 4px 0' }}>
            ${totalActual.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>Incurred expenditures</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, boxShadow: themeStyles.cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, letterSpacing: '0.4px' }}>PORTFOLIO CPI</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: portfolioCPI >= 1 ? '#10b981' : '#f43f5e', backgroundColor: portfolioCPI >= 1 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
              {portfolioCPI >= 1 ? 'UNDER BUDGET' : 'OVER BUDGET'}
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: portfolioCPI >= 1 ? '#10b981' : '#f43f5e', margin: '10px 0 4px 0' }}>
            {portfolioCPI}
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>EV / AC cost efficiency</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: themeStyles.bgCard, border: `1px solid ${themeStyles.border}`, boxShadow: themeStyles.cardShadow }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, letterSpacing: '0.4px' }}>PORTFOLIO SPI</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: portfolioSPI >= 1 ? '#10b981' : '#f59e0b', backgroundColor: portfolioSPI >= 1 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
              {portfolioSPI >= 1 ? 'ON SCHEDULE' : 'SCHEDULE SLIP'}
            </span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: portfolioSPI >= 1 ? '#10b981' : '#f59e0b', margin: '10px 0 4px 0' }}>
            {portfolioSPI}
          </div>
          <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>EV / PV schedule efficiency</div>
        </div>
      </div>

      {/* EVM Project Breakdown Table */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeStyles.border}` }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Project-Level EVM Variance & Forecasted EAC
          </h3>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary, textTransform: 'uppercase', fontSize: '10.5px' }}>
                <th style={{ padding: '12px 18px' }}>Project Initiative</th>
                <th style={{ padding: '12px 14px' }}>PV ($)</th>
                <th style={{ padding: '12px 14px' }}>EV ($)</th>
                <th style={{ padding: '12px 14px' }}>AC ($)</th>
                <th style={{ padding: '12px 14px' }}>CV (Cost Var)</th>
                <th style={{ padding: '12px 14px' }}>SV (Sched Var)</th>
                <th style={{ padding: '12px 14px' }}>CPI</th>
                <th style={{ padding: '12px 14px' }}>SPI</th>
                <th style={{ padding: '12px 18px' }}>Forecasted EAC</th>
              </tr>
            </thead>
            <tbody>
              {financials.map(f => (
                <tr key={f.projectId} style={{ borderBottom: `1px solid ${themeStyles.borderLight}` }}>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: themeStyles.textPrimary }}>
                    {f.projectTitle}
                  </td>
                  <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>
                    ${f.plannedValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#10b981' }}>
                    ${f.earnedValue.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#a855f7' }}>
                    ${f.actualCost.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: f.costVariance >= 0 ? '#10b981' : '#f43f5e' }}>
                    {f.costVariance >= 0 ? `+$${f.costVariance.toLocaleString()}` : `-$${Math.abs(f.costVariance).toLocaleString()}`}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: f.scheduleVariance >= 0 ? '#10b981' : '#f59e0b' }}>
                    {f.scheduleVariance >= 0 ? `+$${f.scheduleVariance.toLocaleString()}` : `-$${Math.abs(f.scheduleVariance).toLocaleString()}`}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: f.cpi >= 1 ? '#10b981' : '#f43f5e' }}>
                    {f.cpi}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 800, color: f.spi >= 1 ? '#10b981' : '#f59e0b' }}>
                    {f.spi}
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: themeStyles.textPrimary }}>
                    ${f.forecastedEAC.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <Modal
          isOpen={isExpenseModalOpen}
          onDismiss={() => setIsExpenseModalOpen(false)}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, borderRadius: '12px', padding: '24px', width: '450px', color: themeStyles.textPrimary }
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Log Direct Actual Cost (AC)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Dropdown
              label="Select Project"
              selectedKey={expenseProjectId}
              options={projects.map(p => ({ key: p.id, text: p.title }))}
              onChange={(_, opt) => opt && setExpenseProjectId(Number(opt.key))}
            />
            <TextField
              label="Expense Amount ($ USD)"
              type="number"
              value={String(expenseAmount)}
              onChange={(_, val) => setExpenseAmount(Number(val) || 0)}
              required
            />
            <TextField
              label="Category"
              value={expenseCategory}
              onChange={(_, val) => setExpenseCategory(val || '')}
            />
            <TextField
              label="Invoice / Justification Note"
              multiline
              rows={2}
              value={expenseNote}
              onChange={(_, val) => setExpenseNote(val || '')}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <DefaultButton text="Cancel" onClick={() => setIsExpenseModalOpen(false)} />
            <PrimaryButton text="Record Expense" onClick={handleLogExpense} styles={{ root: { backgroundColor: themeStyles.accentBlue } }} />
          </div>
        </Modal>
      )}
    </div>
  );
};
