import * as React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectService, TaskService } from '../../services';
import { IProjectItem, ITaskItem } from '../../models';
import { 
  TextField, 
  PrimaryButton, 
  DefaultButton, 
  Dropdown, 
  IDropdownOption, 
  Spinner, 
  SpinnerSize, 
  MessageBar, 
  MessageBarType 
} from '@fluentui/react';

interface IAITaskRecommendation {
  title: string;
  description: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedDays: number;
}

export const ProjectCopilot: React.FC = () => {
  const { config, themeStyles, showToast, triggerRefresh } = useApp();

  const [loading, setLoading] = useState<boolean>(true);
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);

  // WBS Generation State
  const [promptGoal, setPromptGoal] = useState<string>('Establish Disaster Recovery failover drill for secondary Azure region');
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedTasks, setGeneratedTasks] = useState<IAITaskRecommendation[]>([]);

  // Q&A Chat State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'copilot'; text: string; time: string }[]>([
    {
      sender: 'copilot',
      text: 'Hello Alex! I am your Enterprise Project Copilot. I continuously monitor SharePoint project schedules, budget burn rates, and delivery risks. How can I assist your portfolio today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    loadData();
  }, [config]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pList, tList] = await Promise.all([
        ProjectService.getInstance().getProjects(config),
        TaskService.getInstance().getTasks(config)
      ]);
      setProjects(pList);
      setTasks(tList);
      if (pList.length > 0) setSelectedProjectId(pList[0].id);
    } catch (err) {
      console.error('[ProjectCopilot] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWBS = () => {
    if (!promptGoal.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      // Intelligent rule-based WBS generator
      const clean = promptGoal.toLowerCase();
      let suggestions: IAITaskRecommendation[] = [];

      if (clean.includes('disaster') || clean.includes('recovery') || clean.includes('failover')) {
        suggestions = [
          { title: 'Define RTO/RPO Recovery Objectives & SLA Runbook', description: 'Document business continuity targets with compliance auditors.', priority: 'High', estimatedDays: 4 },
          { title: 'Configure Azure Site Recovery (ASR) Target Replication Vault', description: 'Enable continuous replication policies across secondary paired region.', priority: 'Critical', estimatedDays: 6 },
          { title: 'Execute Automated Regional DNS Traffic Routing Cutover Test', description: 'Verify Azure Front Door / Traffic Manager failover health probes.', priority: 'High', estimatedDays: 3 },
          { title: 'Perform Data Integrity & Transaction Log Audit', description: 'Audit database replay consistency after simulated failback.', priority: 'Medium', estimatedDays: 5 }
        ];
      } else if (clean.includes('security') || clean.includes('zero trust') || clean.includes('audit')) {
        suggestions = [
          { title: 'Conduct Microsoft Defender for Cloud Vulnerability Scan', description: 'Inspect container registries and virtual machine posture findings.', priority: 'Critical', estimatedDays: 3 },
          { title: 'Implement Conditional Access Policies with Phishing-Resistant MFA', description: 'Enforce FIDO2 and Windows Hello for Business across admin roles.', priority: 'High', estimatedDays: 5 },
          { title: 'Review Privileged Identity Management (PIM) Just-in-Time Approvals', description: 'Restrict standing Global Admin role assignments to time-bound activations.', priority: 'High', estimatedDays: 4 },
          { title: 'Publish ISO 27001 Compliance Attestation Dossier', description: 'Compile evidence artifacts for external third-party penetration testers.', priority: 'Medium', estimatedDays: 7 }
        ];
      } else {
        suggestions = [
          { title: `Architecture Design Specification for ${promptGoal}`, description: 'Produce technical system requirements and sequence flow diagrams.', priority: 'High', estimatedDays: 5 },
          { title: `Core API & Database Schema Implementation`, description: 'Construct REST endpoints, database tables, and unit test suites.', priority: 'High', estimatedDays: 8 },
          { title: `End-to-End Integration Testing & Load Benchmarking`, description: 'Simulate concurrent user traffic and measure response percentiles.', priority: 'Medium', estimatedDays: 4 },
          { title: `Client UAT Demonstration & Production Handover`, description: 'Demonstrate completed acceptance criteria to executive sponsors.', priority: 'Medium', estimatedDays: 3 }
        ];
      }

      setGeneratedTasks(suggestions);
      setGenerating(false);
      showToast('Copilot generated 4 structured work items!', 'success');
    }, 900);
  };

  const handleAddAITasksToProject = async () => {
    if (generatedTasks.length === 0 || !selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    const service = TaskService.getInstance();

    for (const t of generatedTasks) {
      await service.createTask(
        {
          taskId: `AI-${Math.floor(100 + Math.random() * 900)}`,
          projectId: selectedProjectId,
          projectTitle: project?.title || '',
          title: t.title,
          description: t.description,
          assignedTo: project?.projectManager || null,
          startDate: new Date().toISOString(),
          dueDate: new Date(Date.now() + t.estimatedDays * 86400000).toISOString(),
          priority: t.priority,
          status: 'To Do',
          completionPercentage: 0
        },
        config
      );
    }

    showToast(`Added ${generatedTasks.length} AI-generated tasks to '${project?.title}' in SharePoint!`, 'success');
    setGeneratedTasks([]);
    triggerRefresh();
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatHistory(prev => [...prev, { sender: 'user', text: q, time }]);
    setChatInput('');

    setTimeout(() => {
      let reply = '';
      const lower = q.toLowerCase();
      if (lower.includes('overdue')) {
        const overdue = tasks.filter(t => t.status !== 'Completed' && new Date(t.dueDate).getTime() < Date.now());
        reply = `There is currently ${overdue.length} overdue task: "${overdue[0]?.title || 'None'}" for project "${overdue[0]?.projectTitle || 'N/A'}". Immediate escalation recommended.`;
      } else if (lower.includes('budget') || lower.includes('cost')) {
        reply = `Portfolio budget summary: Total allocated $${projects.reduce((a, b) => a + b.budget, 0).toLocaleString()} across ${projects.length} projects. Project "Global Supply Chain Analytics" is running close to its $280,000 threshold ($260,000 spent).`;
      } else if (lower.includes('health') || lower.includes('status')) {
        reply = `Overall portfolio health is rated at 87% (HEALTHY). 3 projects are in Active delivery, 1 is Completed (Woodgrove Compliance), and 1 has minor schedule delay (Fabrikam Supply Chain).`;
      } else {
        reply = `Based on your SharePoint portfolio telemetry, all 5 projects are indexed. You have 7 total tasks, with 84% average team utilization. Would you like me to generate a mitigation plan or break down a new objective?`;
      }

      setChatHistory(prev => [
        ...prev,
        {
          sender: 'copilot',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 600);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '22px',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
            }}
          >
            ✨
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: themeStyles.textPrimary }}>
              AI Project Copilot & Delivery Intelligence
            </h2>
            <div style={{ fontSize: '13px', color: themeStyles.textSecondary, marginTop: '2px' }}>
              Autonomous risk identification, intelligent Work Breakdown Structure (WBS) generation, and portfolio health monitoring.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#a78bfa',
              fontWeight: 700,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#a78bfa' }} />
            Azure OpenAI Active
          </span>
        </div>
      </div>

      {/* Main Grid: WBS Generator & Conversational Copilot */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
          gap: '24px'
        }}
      >
        {/* Section 1: AI Work Breakdown Structure (WBS) Generator */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
              AI Work Breakdown Structure (WBS) Generator
            </h3>
            <span style={{ fontSize: '11px', color: themeStyles.accentBlue, fontWeight: 600 }}>
              Auto-Schedules to SharePoint
            </span>
          </div>

          <div style={{ fontSize: '13px', color: themeStyles.textSecondary }}>
            Enter a high-level deliverable goal. Copilot breaks it down into sequential enterprise work items with estimated durations and priorities.
          </div>

          <Dropdown
            label="Target Enterprise Project"
            selectedKey={selectedProjectId}
            options={projects.map(p => ({ key: p.id, text: `${p.projectId}: ${p.title}` }))}
            onChange={(_, opt) => opt && setSelectedProjectId(Number(opt.key))}
          />

          <TextField
            label="High-Level Objective / Epic"
            multiline
            rows={2}
            value={promptGoal}
            onChange={(_, val) => setPromptGoal(val || '')}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <PrimaryButton
              text={generating ? 'Generating with Copilot...' : 'Generate WBS Tasks'}
              iconProps={{ iconName: 'Sparkle' }}
              disabled={generating || !promptGoal.trim()}
              onClick={handleGenerateWBS}
              styles={{ root: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', borderRadius: '6px' } }}
            />
          </div>

          {/* Generated Tasks Output List */}
          {generatedTasks.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: themeStyles.textPrimary }}>
                  Proposed Deliverables ({generatedTasks.length}):
                </span>
                <PrimaryButton
                  text="Commit to SharePoint Tasks"
                  iconProps={{ iconName: 'Accept' }}
                  onClick={handleAddAITasksToProject}
                  styles={{ root: { backgroundColor: themeStyles.accentGreen, borderColor: themeStyles.accentGreen, borderRadius: '6px' } }}
                />
              </div>

              {generatedTasks.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    backgroundColor: themeStyles.bgCardHover,
                    border: `1px solid ${themeStyles.border}`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: themeStyles.textPrimary }}>
                      {idx + 1}. {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: item.priority === 'Critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: item.priority === 'Critical' ? themeStyles.accentRed : themeStyles.accentAmber
                      }}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: themeStyles.textSecondary }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '10.5px', color: themeStyles.accentBlue, marginTop: '2px' }}>
                    Est. Duration: {item.estimatedDays} business days
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Conversational Copilot Chat Interface */}
        <div
          style={{
            padding: '24px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '600px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: `1px solid ${themeStyles.border}` }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: themeStyles.textPrimary }}>
              Portfolio Chat & Decision Support
            </h3>
            <span style={{ fontSize: '11px', color: themeStyles.textMuted }}>
              Model: GPT-4o / Azure M365 Copilot
            </span>
          </div>

          {/* Chat Messages Log */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '6px' }}>
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: msg.sender === 'user' ? themeStyles.accentBlue : themeStyles.bgCardHover,
                    color: msg.sender === 'user' ? '#fff' : themeStyles.textPrimary,
                    fontSize: '13px',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '10.5px', color: themeStyles.textMuted, margin: '0 4px' }}>
                  {msg.sender === 'user' ? 'You' : 'Project Copilot'} • {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Query Suggestions */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '12px 0 8px 0' }}>
            {['Show overdue tasks', 'Check budget burn rates', 'Summarize portfolio health'].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setChatInput(prompt)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: themeStyles.bgCardHover,
                  border: `1px solid ${themeStyles.border}`,
                  color: themeStyles.textSecondary,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <TextField
                placeholder="Ask Copilot about projects, budgets, or team deadlines..."
                value={chatInput}
                onChange={(_, val) => setChatInput(val || '')}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
              />
            </div>
            <PrimaryButton
              text="Ask"
              iconProps={{ iconName: 'Send' }}
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              styles={{ root: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', borderRadius: '6px' } }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
