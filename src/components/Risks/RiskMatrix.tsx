import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService } from '../../services';
import { IRiskItem, IProjectItem } from '../../models';
import { INITIAL_RISKS } from '../../services/MockData';
import { getStatusBadgeStyle } from '../../styles/theme';
import { 
  PrimaryButton, 
  DefaultButton, 
  IconButton, 
  Modal, 
  TextField, 
  Dropdown, 
  IDropdownOption, 
  Slider, 
  Spinner, 
  SpinnerSize,
  SearchBox
} from '@fluentui/react';

export const RiskMatrix: React.FC = () => {
  const { config, themeStyles, currentTheme, showToast, refreshTrigger } = useApp();
  const isDark = currentTheme === 'dark';

  const [loading, setLoading] = useState<boolean>(true);
  const [risks, setRisks] = useState<IRiskItem[]>([...INITIAL_RISKS]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newProjectId, setNewProjectId] = useState<number>(1);
  const [newCategory, setNewCategory] = useState<IRiskItem['category']>('Technical');
  const [newProb, setNewProb] = useState<number>(3);
  const [newImp, setNewImp] = useState<number>(3);
  const [newOwner, setNewOwner] = useState<string>('');
  const [newMitigation, setNewMitigation] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [config, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    try {
      const pList = await ProjectService.getInstance().getProjects(config);
      setProjects(pList);
      if (pList.length > 0) setNewProjectId(pList[0].id);
    } catch (err) {
      console.error('[RiskMatrix] Error loading projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRisk = () => {
    if (!newTitle.trim()) return;
    const project = projects.find(p => p.id === newProjectId);
    const newRisk: IRiskItem = {
      id: Date.now(),
      projectId: newProjectId,
      projectTitle: project?.title || 'Core Enterprise Initiative',
      title: newTitle,
      description: newDesc,
      probability: newProb as any,
      impact: newImp as any,
      score: newProb * newImp,
      status: 'Identified',
      category: newCategory,
      owner: newOwner || 'Unassigned',
      mitigationPlan: newMitigation
    };

    setRisks(prev => [newRisk, ...prev]);
    showToast(`Risk '${newTitle}' logged with Score ${newRisk.score}.`, 'success');
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewMitigation('');
    setNewOwner('');
  };

  // Determine cell color by score
  const getCellColor = (prob: number, imp: number) => {
    const score = prob * imp;
    if (score >= 15) return '#f43f5e'; // Red
    if (score >= 10) return '#f97316'; // Orange
    if (score >= 6) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      const matchesCell = !selectedCell || (r.probability === selectedCell.prob && r.impact === selectedCell.imp);
      const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
      const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.owner.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCell && matchesCategory && matchesSearch;
    });
  }, [risks, selectedCell, categoryFilter, searchQuery]);

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
            5x5 Quantitative Risk Heatmap & Assessment Matrix
          </h2>
          <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, marginTop: '2px' }}>
            PMI-standard Probability × Impact assessment with interactive cell filtering
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {selectedCell && (
            <DefaultButton
              text="Clear Matrix Filter"
              iconProps={{ iconName: 'ClearFilter' }}
              onClick={() => setSelectedCell(null)}
              styles={{ root: { borderRadius: '8px', borderColor: themeStyles.border } }}
            />
          )}
          <PrimaryButton
            text="Log New Risk"
            iconProps={{ iconName: 'Add' }}
            onClick={() => setIsModalOpen(true)}
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
      </div>

      {/* Heatmap & Risk Metrics Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}
      >
        {/* Interactive 5x5 Heatmap Matrix */}
        <div
          style={{
            padding: '22px 24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            boxShadow: themeStyles.cardShadow
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Probability (1-5) vs. Impact (1-5)
            </h3>
            <span style={{ fontSize: '11px', color: themeStyles.textSecondary }}>
              Click any cell to isolate risks
            </span>
          </div>

          {/* 5x5 Matrix Visual */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[5, 4, 3, 2, 1].map(prob => (
              <div key={prob} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '24px', fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary, textAlign: 'right' }}>
                  P{prob}
                </span>
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(imp => {
                    const cellRisks = risks.filter(r => r.probability === prob && r.impact === imp);
                    const isSelected = selectedCell?.prob === prob && selectedCell?.imp === imp;
                    const cellColor = getCellColor(prob, imp);

                    return (
                      <div
                        key={imp}
                        onClick={() => setSelectedCell(isSelected ? null : { prob, imp })}
                        style={{
                          height: '52px',
                          borderRadius: '8px',
                          backgroundColor: isSelected
                            ? `${cellColor}44`
                            : isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: `2px solid ${isSelected ? cellColor : `${cellColor}33`}`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = cellColor}
                        onMouseLeave={e => {
                          if (!isSelected) e.currentTarget.style.borderColor = `${cellColor}33`;
                        }}
                      >
                        <span style={{ fontSize: '10px', color: themeStyles.textMuted }}>{prob * imp}</span>
                        {cellRisks.length > 0 && (
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: '#fff',
                              backgroundColor: cellColor,
                              padding: '1px 6px',
                              borderRadius: '8px',
                              marginTop: '2px'
                            }}
                          >
                            {cellRisks.length}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ width: '24px' }} />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: themeStyles.textSecondary }}>
                <span>I1</span>
                <span>I2</span>
                <span>I3</span>
                <span>I4</span>
                <span>I5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Register Summary Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '14px',
              boxShadow: themeStyles.cardShadow
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary }}>CRITICAL SEVERITY (SCORE ≥ 15)</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
                {risks.filter(r => r.score >= 15).length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: themeStyles.textSecondary }}>ACTIVE MITIGATION</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: themeStyles.accentBlue, marginTop: '4px' }}>
                {risks.filter(r => r.status === 'Mitigating').length}
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: '20px',
              borderRadius: '12px',
              backgroundColor: themeStyles.bgCard,
              border: `1px solid ${themeStyles.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: themeStyles.cardShadow
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: themeStyles.textPrimary }}>
              PMI Quantitative Severity Legend
            </div>
            <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary, lineHeight: 1.5 }}>
              • <b>15 - 25 Critical</b>: Mandatory escalation to Executive Steering Committee.<br />
              • <b>10 - 14 High</b>: Active risk mitigation and contingency budget allocation.<br />
              • <b>6 - 9 Moderate</b>: Monitored in bi-weekly project status reviews.<br />
              • <b>1 - 5 Low</b>: Accepted risk posture with documented standard operations.
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Risk Register Table */}
      <div
        style={{
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: themeStyles.cardShadow
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${themeStyles.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Risk Register ({filteredRisks.length})
            </h3>
            {selectedCell && (
              <span style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 700, backgroundColor: 'rgba(14,165,233,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Cell: P{selectedCell.prob} × I{selectedCell.imp} (Score {selectedCell.prob * selectedCell.imp})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ width: '150px' }}>
              <Dropdown
                selectedKey={categoryFilter}
                onChange={(_, opt) => opt && setCategoryFilter(opt.key as string)}
                options={[
                  { key: 'All', text: 'All Categories' },
                  { key: 'Technical', text: 'Technical' },
                  { key: 'Schedule', text: 'Schedule' },
                  { key: 'Budget', text: 'Budget' },
                  { key: 'Resource', text: 'Resource' },
                  { key: 'Security', text: 'Security' }
                ]}
                styles={{
                  title: {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderColor: themeStyles.border,
                    borderRadius: '8px',
                    height: '32px',
                    lineHeight: '30px',
                    fontSize: '11.5px',
                    color: themeStyles.textPrimary
                  }
                }}
              />
            </div>
            <div style={{ width: '200px' }}>
              <SearchBox
                placeholder="Search risk or owner..."
                value={searchQuery}
                onChange={(_, val) => setSearchQuery(val || '')}
                onClear={() => setSearchQuery('')}
                styles={{
                  root: {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderRadius: '8px',
                    border: `1px solid ${themeStyles.border}`,
                    height: '32px'
                  },
                  field: { fontSize: '11.5px', color: themeStyles.textPrimary }
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary, textTransform: 'uppercase', fontSize: '10.5px' }}>
                <th style={{ padding: '12px 18px' }}>Risk Title</th>
                <th style={{ padding: '12px 14px' }}>Project</th>
                <th style={{ padding: '12px 14px' }}>Category</th>
                <th style={{ padding: '12px 14px' }}>Prob × Imp</th>
                <th style={{ padding: '12px 14px' }}>Score</th>
                <th style={{ padding: '12px 14px' }}>Owner</th>
                <th style={{ padding: '12px 18px' }}>Mitigation Plan</th>
              </tr>
            </thead>
            <tbody>
              {filteredRisks.map(r => (
                <tr key={r.id} style={{ borderBottom: `1px solid ${themeStyles.borderLight}` }}>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: themeStyles.textPrimary }}>
                    {r.title}
                  </td>
                  <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>
                    {r.projectTitle || 'Enterprise'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', color: themeStyles.accentBlue }}>{r.category}</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: themeStyles.textSecondary }}>
                    {r.probability} × {r.impact}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: getCellColor(r.probability, r.impact),
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '11px'
                      }}
                    >
                      {r.score}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: themeStyles.textPrimary }}>
                    {r.owner}
                  </td>
                  <td style={{ padding: '12px 18px', color: themeStyles.textSecondary, maxWidth: '280px' }}>
                    {r.mitigationPlan}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating New Risk */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onDismiss={() => setIsModalOpen(false)}
          styles={{
            main: { backgroundColor: themeStyles.bgCardElevated, borderRadius: '12px', padding: '24px', width: '500px', color: themeStyles.textPrimary }
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>Log Quantitative Risk</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <TextField label="Risk Title" value={newTitle} onChange={(_, val) => setNewTitle(val || '')} required />
            <TextField label="Description" multiline rows={2} value={newDesc} onChange={(_, val) => setNewDesc(val || '')} />
            <Dropdown
              label="Associated Project"
              selectedKey={newProjectId}
              options={projects.map(p => ({ key: p.id, text: p.title }))}
              onChange={(_, opt) => opt && setNewProjectId(Number(opt.key))}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Slider label={`Probability (1-5): ${newProb}`} min={1} max={5} value={newProb} onChange={val => setNewProb(val)} />
              <Slider label={`Impact (1-5): ${newImp}`} min={1} max={5} value={newImp} onChange={val => setNewImp(val)} />
            </div>
            <TextField label="Risk Owner" value={newOwner} onChange={(_, val) => setNewOwner(val || '')} />
            <TextField label="Mitigation Plan" multiline rows={2} value={newMitigation} onChange={(_, val) => setNewMitigation(val || '')} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <DefaultButton text="Cancel" onClick={() => setIsModalOpen(false)} />
            <PrimaryButton text="Save Risk" onClick={handleCreateRisk} styles={{ root: { backgroundColor: themeStyles.accentBlue } }} />
          </div>
        </Modal>
      )}
    </div>
  );
};
