import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService } from '../../services';
import { IRiskItem, IProjectItem } from '../../models';
import { INITIAL_RISKS } from '../../services/MockData';
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
  SpinnerSize 
} from '@fluentui/react';

export const RiskMatrix: React.FC = () => {
  const { config, themeStyles, showToast, refreshTrigger } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [risks, setRisks] = useState<IRiskItem[]>([...INITIAL_RISKS]);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [selectedCell, setSelectedCell] = useState<{ prob: number; imp: number } | null>(null);

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
      projectTitle: project?.title || '',
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
  };

  // Determine cell color by score
  const getCellColor = (prob: number, imp: number) => {
    const score = prob * imp;
    if (score >= 15) return '#ef4444'; // Red
    if (score >= 10) return '#f97316'; // Orange
    if (score >= 6) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const filteredRisks = selectedCell
    ? risks.filter(r => r.probability === selectedCell.prob && r.impact === selectedCell.imp)
    : risks;

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
            Enterprise 5x5 Risk Heatmap Matrix & Register
          </h2>
          <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '4px' }}>
            Probability vs. Impact quantitative risk modeling with active mitigation tracking.
          </div>
        </div>

        <PrimaryButton
          text="Log New Risk"
          iconProps={{ iconName: 'Warning12' }}
          onClick={() => setIsModalOpen(true)}
          styles={{ root: { backgroundColor: themeStyles.accentRed, borderColor: themeStyles.accentRed, borderRadius: '6px' } }}
        />
      </div>

      {/* 5x5 Matrix + Details Container */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Heatmap Visual Matrix */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Probability vs. Impact Heatmap
            </h3>
            {selectedCell && (
              <DefaultButton
                text="Reset Filter"
                onClick={() => setSelectedCell(null)}
                styles={{ root: { height: '24px', fontSize: '11px' } }}
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Y-Axis Label */}
            <div
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '11px',
                color: themeStyles.textMuted,
                letterSpacing: '2px'
              }}
            >
              PROBABILITY &rarr;
            </div>

            {/* 5x5 Grid */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[5, 4, 3, 2, 1].map(prob => (
                <div key={prob} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ width: '16px', fontSize: '11px', color: themeStyles.textMuted, textAlign: 'right' }}>
                    {prob}
                  </span>
                  {[1, 2, 3, 4, 5].map(imp => {
                    const count = risks.filter(r => r.probability === prob && r.impact === imp).length;
                    const cellColor = getCellColor(prob, imp);
                    const isSelected = selectedCell?.prob === prob && selectedCell?.imp === imp;

                    return (
                      <div
                        key={imp}
                        onClick={() => setSelectedCell({ prob, imp })}
                        style={{
                          flex: 1,
                          height: '52px',
                          borderRadius: '6px',
                          backgroundColor: `${cellColor}22`,
                          border: isSelected ? `3px solid #fff` : `1px solid ${cellColor}88`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease',
                          position: 'relative'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <span style={{ fontSize: '10px', color: themeStyles.textMuted, opacity: 0.7 }}>
                          {prob * imp}
                        </span>
                        {count > 0 && (
                          <span
                            style={{
                              backgroundColor: cellColor,
                              color: '#fff',
                              fontSize: '11px',
                              fontWeight: 800,
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* X-Axis Numbers & Label */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', paddingLeft: '22px' }}>
                {[1, 2, 3, 4, 5].map(imp => (
                  <div key={imp} style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: themeStyles.textMuted }}>
                    {imp}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, color: themeStyles.textMuted, letterSpacing: '2px', marginTop: '2px' }}>
                IMPACT &rarr;
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px', padding: '10px 14px', backgroundColor: themeStyles.bgCardHover, borderRadius: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.textSecondary }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#10b981' }} />
              Low (1–5)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.textSecondary }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f59e0b' }} />
              Moderate (6–9)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.textSecondary }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#f97316' }} />
              High (10–14)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: themeStyles.textSecondary }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#ef4444' }} />
              Critical (15–25)
            </span>
          </div>
        </div>

        {/* Risk Register Table / Cards */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Risk Register ({filteredRisks.length})
            </h3>
            {selectedCell && (
              <span style={{ fontSize: '12px', color: themeStyles.accentBlue }}>
                Prob: {selectedCell.prob} × Imp: {selectedCell.imp} (Score: {selectedCell.prob * selectedCell.imp})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
            {filteredRisks.map(r => {
              const color = getCellColor(r.probability, r.impact);
              return (
                <div
                  key={r.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    backgroundColor: themeStyles.bgCardHover,
                    borderLeft: `4px solid ${color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>
                        {r.title}
                      </span>
                      <div style={{ fontSize: '11px', color: themeStyles.accentBlue, marginTop: '2px' }}>
                        {r.projectTitle} • Category: {r.category}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${color}22`,
                        color
                      }}
                    >
                      SCORE: {r.score}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: themeStyles.textSecondary }}>
                    {r.description}
                  </p>

                  <div style={{ fontSize: '11px', color: themeStyles.textMuted, borderTop: `1px solid ${themeStyles.borderLight}`, paddingTop: '6px', marginTop: '2px' }}>
                    <strong>Mitigation Plan:</strong> {r.mitigationPlan}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log Risk Modal */}
      <Modal
        isOpen={isModalOpen}
        onDismiss={() => setIsModalOpen(false)}
        styles={{
          main: {
            width: '560px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${themeStyles.border}` }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: themeStyles.textPrimary }}>
            Log New Risk into Register
          </h3>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Dropdown
            label="Project"
            required
            selectedKey={newProjectId}
            options={projects.map(p => ({ key: p.id, text: p.title }))}
            onChange={(_, opt) => opt && setNewProjectId(Number(opt.key))}
          />

          <TextField
            label="Risk Statement / Title"
            required
            value={newTitle}
            onChange={(_, val) => setNewTitle(val || '')}
          />

          <TextField
            label="Risk Description & Root Cause"
            multiline
            rows={2}
            value={newDesc}
            onChange={(_, val) => setNewDesc(val || '')}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Slider
              label={`Probability (1-5): ${newProb}`}
              min={1}
              max={5}
              value={newProb}
              onChange={val => setNewProb(val)}
            />
            <Slider
              label={`Impact (1-5): ${newImp}`}
              min={1}
              max={5}
              value={newImp}
              onChange={val => setNewImp(val)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Dropdown
              label="Risk Category"
              selectedKey={newCategory}
              options={[
                { key: 'Technical', text: 'Technical' },
                { key: 'Schedule', text: 'Schedule' },
                { key: 'Budget', text: 'Budget' },
                { key: 'Resource', text: 'Resource' },
                { key: 'Security', text: 'Security' }
              ]}
              onChange={(_, opt) => opt && setNewCategory(opt.key as any)}
            />
            <TextField
              label="Assigned Risk Owner"
              value={newOwner}
              onChange={(_, val) => setNewOwner(val || '')}
            />
          </div>

          <TextField
            label="Mitigation Action Plan"
            multiline
            rows={2}
            placeholder="Actions to reduce probability or impact..."
            value={newMitigation}
            onChange={(_, val) => setNewMitigation(val || '')}
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
          <DefaultButton text="Cancel" onClick={() => setIsModalOpen(false)} />
          <PrimaryButton
            text="Save Risk"
            onClick={handleCreateRisk}
            styles={{ root: { backgroundColor: themeStyles.accentRed, borderColor: themeStyles.accentRed } }}
          />
        </div>
      </Modal>
    </div>
  );
};
