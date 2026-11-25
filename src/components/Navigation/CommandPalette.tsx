import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useApp, NavView } from '../../context/AppContext';
import { ProjectService, TaskService } from '../../services';
import { IProjectItem, ITaskItem } from '../../models';
import { Modal } from '@fluentui/react';

interface ICommandItem {
  id: string;
  category: 'Navigation' | 'Project' | 'Task' | 'Action';
  title: string;
  subtitle?: string;
  icon: string;
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const { themeStyles, setActiveView, setSelectedProjectId, config, toggleTheme } = useApp();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [projects, setProjects] = useState<IProjectItem[]>([]);
  const [tasks, setTasks] = useState<ITaskItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Global Ctrl+K / Cmd+K key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadEntities();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const loadEntities = async () => {
    try {
      const [pList, tList] = await Promise.all([
        ProjectService.getInstance().getProjects(config),
        TaskService.getInstance().getTasks(config)
      ]);
      setProjects(pList);
      setTasks(tList);
    } catch (err) {
      console.error('[CommandPalette] Error loading entities:', err);
    }
  };

  const navActions: ICommandItem[] = [
    { id: 'nav-dash', category: 'Navigation', title: 'Go to Executive Dashboard', subtitle: 'Portfolio KPIs and charts', icon: 'ViewDashboard', action: () => { setActiveView('dashboard'); setIsOpen(false); } },
    { id: 'nav-proj', category: 'Navigation', title: 'Go to Projects Portfolio', subtitle: 'Full project portfolio management', icon: 'ProjectDocument', action: () => { setActiveView('projects'); setIsOpen(false); } },
    { id: 'nav-gantt', category: 'Navigation', title: 'Go to Gantt Schedule & Timeline', subtitle: 'Roadmap delivery milestones', icon: 'Timeline', action: () => { setActiveView('timeline'); setIsOpen(false); } },
    { id: 'nav-kanban', category: 'Navigation', title: 'Go to Interactive Kanban Board', subtitle: 'Drag & drop task workflow', icon: 'Tiles', action: () => { setActiveView('kanban'); setIsOpen(false); } },
    { id: 'nav-tasks', category: 'Navigation', title: 'Go to Tasks Management', subtitle: 'Work item breakdown', icon: 'TaskGroup', action: () => { setActiveView('tasks'); setIsOpen(false); } },
    { id: 'nav-copilot', category: 'Navigation', title: 'Open AI Project Copilot', subtitle: 'AI WBS generator & chat intelligence', icon: 'Sparkle', action: () => { setActiveView('copilot'); setIsOpen(false); } },
    { id: 'nav-risks', category: 'Navigation', title: 'Go to 5x5 Risk Heatmap Matrix', subtitle: 'Quantitative risk modeling', icon: 'Warning12', action: () => { setActiveView('risks'); setIsOpen(false); } },
    { id: 'nav-financials', category: 'Navigation', title: 'Go to EVM Financials & Burn-Down', subtitle: 'CPI, SPI, and cost tracking', icon: 'Money', action: () => { setActiveView('financials'); setIsOpen(false); } },
    { id: 'nav-excel', category: 'Navigation', title: 'Go to Excel Bulk Upload', subtitle: 'Ingest spreadsheets with validation', icon: 'ExcelLogo', action: () => { setActiveView('excel'); setIsOpen(false); } },
    { id: 'nav-docs', category: 'Navigation', title: 'Go to Document Library', subtitle: 'SharePoint project documents', icon: 'FabricFolder', action: () => { setActiveView('documents'); setIsOpen(false); } },
    { id: 'nav-appr', category: 'Navigation', title: 'Go to Governance & Approvals', subtitle: 'Review pending changes', icon: 'CheckList', action: () => { setActiveView('approvals'); setIsOpen(false); } },
    { id: 'nav-team', category: 'Navigation', title: 'Go to Team Allocation & Capacity', subtitle: 'Squad workload breakdown', icon: 'People', action: () => { setActiveView('team'); setIsOpen(false); } },
    { id: 'nav-rep', category: 'Navigation', title: 'Go to Reports & Analytics', subtitle: 'Excel and print export', icon: 'BarChartVertical', action: () => { setActiveView('reports'); setIsOpen(false); } },
    { id: 'nav-set', category: 'Navigation', title: 'Go to Dynamic Schema Configuration', subtitle: 'Map SharePoint lists dynamically', icon: 'Settings', action: () => { setActiveView('settings'); setIsOpen(false); } },
    { id: 'act-theme', category: 'Action', title: 'Toggle Dark / Light Theme Mode', subtitle: 'Switch color theme', icon: 'Sunny', action: () => { toggleTheme(); setIsOpen(false); } }
  ];

  const projectActions: ICommandItem[] = projects.map(p => ({
    id: `p-${p.id}`,
    category: 'Project',
    title: `${p.projectId}: ${p.title}`,
    subtitle: `Client: ${p.clientName} • Budget: $${p.budget.toLocaleString()}`,
    icon: 'ProjectDocument',
    action: () => {
      setSelectedProjectId(p.id);
      setActiveView('project-detail');
      setIsOpen(false);
    }
  }));

  const taskActions: ICommandItem[] = tasks.map(t => ({
    id: `t-${t.id}`,
    category: 'Task',
    title: `${t.taskId}: ${t.title}`,
    subtitle: `Project #${t.projectId} • Status: ${t.status}`,
    icon: 'TaskGroup',
    action: () => {
      setActiveView('kanban');
      setIsOpen(false);
    }
  }));

  const allItems: ICommandItem[] = useMemo(() => {
    return [...navActions, ...projectActions, ...taskActions];
  }, [projects, tasks]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 8);
    const q = query.toLowerCase();
    return allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [allItems, query]);

  const handleKeyDownInInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={() => setIsOpen(false)}
      styles={{
        main: {
          width: '620px',
          maxWidth: '92vw',
          backgroundColor: themeStyles.bgCard,
          border: `1px solid ${themeStyles.border}`,
          borderRadius: '12px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          top: '15%'
        }
      }}
    >
      {/* Search Input Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          borderBottom: `1px solid ${themeStyles.border}`,
          backgroundColor: themeStyles.bgCardHover
        }}
      >
        <i className="ms-Icon ms-Icon--Search" style={{ fontSize: '18px', color: themeStyles.accentBlue }} />
        <input
          autoFocus
          placeholder="Search commands, projects, tasks, or jump to view... (Press Esc to close)"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDownInInput}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: themeStyles.textPrimary,
            fontFamily: 'inherit'
          }}
        />
        <span
          style={{
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: themeStyles.bgCard,
            border: `1px solid ${themeStyles.border}`,
            color: themeStyles.textMuted
          }}
        >
          ESC
        </span>
      </div>

      {/* Results List */}
      <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
        {filteredItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: themeStyles.textMuted, fontSize: '13px' }}>
            No commands or entities match "{query}"
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <div
                key={item.id}
                onClick={item.action}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(0, 168, 232, 0.15)' : 'transparent',
                  color: isSelected ? themeStyles.accentBlue : themeStyles.textPrimary,
                  transition: 'background-color 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                  <i
                    className={`ms-Icon ms-Icon--${item.icon}`}
                    style={{ fontSize: '18px', color: isSelected ? themeStyles.accentBlue : themeStyles.textSecondary }}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 600 }}>{item.title}</div>
                    {item.subtitle && (
                      <div style={{ fontSize: '11px', color: themeStyles.textMuted }}>{item.subtitle}</div>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: themeStyles.bgCardHover,
                    color: themeStyles.textMuted,
                    textTransform: 'uppercase'
                  }}
                >
                  {item.category}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Helper */}
      <div
        style={{
          padding: '10px 18px',
          borderTop: `1px solid ${themeStyles.border}`,
          backgroundColor: themeStyles.bgCardHover,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: themeStyles.textMuted
        }}
      >
        <span>Use <strong>↑</strong> <strong>↓</strong> to navigate, <strong>Enter</strong> to select</span>
        <span>Press <strong>Ctrl + K</strong> anywhere to toggle</span>
      </div>
    </Modal>
  );
};
