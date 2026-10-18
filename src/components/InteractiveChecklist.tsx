/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FixItem } from '../types/seo';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Trophy,
} from 'lucide-react';

export interface ChecklistTask {
  id: string;
  text: string;
  reason?: string;
  priority: 'High' | 'Medium' | 'Low' | 'Custom';
  completed: boolean;
  isCustom?: boolean;
  createdAt: number;
}

interface InteractiveChecklistProps {
  fixes: FixItem[];
  auditId?: string;
}

export const InteractiveChecklist: React.FC<InteractiveChecklistProps> = ({ fixes, auditId }) => {
  const sessionKey = useMemo(() => {
    // Unique key per session and audit instance to prevent collisions
    const safeId = auditId ? auditId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'default';
    return `seo_interactive_checklist_${safeId}`;
  }, [auditId]);

  // Initial task creator helper
  const createInitialTasks = useCallback((): ChecklistTask[] => {
    return fixes.map((fix, idx) => ({
      id: `task-fix-${idx}-${fix.action.slice(0, 16).replace(/\s+/g, '-').toLowerCase()}`,
      text: fix.action,
      reason: fix.reason,
      priority: fix.priority,
      completed: false,
      isCustom: false,
      createdAt: Date.now() + idx,
    }));
  }, [fixes]);

  // Tasks state initialized from sessionStorage or fallback
  const [tasks, setTasks] = useState<ChecklistTask[]>(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors in restrictive environments
    }
    return createInitialTasks();
  });

  // Re-sync when sessionKey or fixes change if no prior stored state exists
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTasks(parsed);
          return;
        }
      }
    } catch {
      // Ignore
    }
    setTasks(createInitialTasks());
  }, [sessionKey, createInitialTasks]);

  // Persist to sessionStorage on changes
  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Failed to save checklist state to sessionStorage:', e);
    }
  }, [tasks, sessionKey]);

  // Filtering & input state
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low' | 'Custom'>('Medium');
  const [copiedStatus, setCopiedStatus] = useState<string | null>(null);

  // Toggle single task completion
  const handleToggle = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Add custom user task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskText.trim();
    if (!trimmed) return;

    const newTask: ChecklistTask = {
      id: `task-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: trimmed,
      reason: 'Custom webmaster action added during audit session',
      priority: newTaskPriority,
      completed: false,
      isCustom: true,
      createdAt: Date.now(),
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
  };

  // Remove custom task
  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Mark all complete / incomplete
  const handleMarkAll = (completed: boolean) => {
    setTasks(prev => prev.map(t => ({ ...t, completed })));
  };

  // Reset to original audit fixes
  const handleReset = () => {
    if (window.confirm('Reset the checklist to the initial audit recommendations?')) {
      const fresh = createInitialTasks();
      setTasks(fresh);
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(fresh));
      } catch {
        // Ignore
      }
    }
  };

  // Copy checklist as formatted Markdown
  const handleCopyMarkdown = () => {
    const mdLines = [
      `# SEO Implementation Checklist`,
      `*Progress: ${tasks.filter(t => t.completed).length}/${tasks.length} completed*\n`,
      ...tasks.map(t => {
        const check = t.completed ? '[x]' : '[ ]';
        const badge = `[${t.priority.toUpperCase()}]`;
        const note = t.reason ? `\n  - *Note:* ${t.reason}` : '';
        return `- ${check} ${badge} ${t.text}${note}`;
      }),
    ];
    navigator.clipboard.writeText(mdLines.join('\n'));
    setCopiedStatus('markdown');
    setTimeout(() => setCopiedStatus(null), 2000);
  };

  // Computed metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  // Filtered task view
  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'Pending') return !t.completed;
      if (filter === 'Completed') return t.completed;
      return true;
    });
  }, [tasks, filter]);

  const getPriorityStyle = (priority: 'High' | 'Medium' | 'Low' | 'Custom') => {
    switch (priority) {
      case 'High':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
          badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'Medium':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
          badgeClass: 'text-amber-800 bg-amber-50 border-amber-200',
        };
      case 'Low':
        return {
          icon: <Info className="w-3.5 h-3.5 text-slate-600" />,
          badgeClass: 'text-slate-700 bg-slate-100 border-slate-200',
        };
      case 'Custom':
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-600" />,
          badgeClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        };
    }
  };

  return (
    <div id="checklist" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header with Title and Session Persistence Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Interactive SEO Checklist
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100/70 text-emerald-800 rounded-full border border-emerald-200">
                Session Saved
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Track tasks as you update your live site. Checked states persist locally throughout your session.
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 ${
              copiedStatus === 'markdown'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Copy current checklist status as Markdown"
          >
            {copiedStatus === 'markdown' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied Status</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Checklist</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center gap-1"
            title="Reset checklist to original audit tasks"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Milestone Status */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Implementation Progress</span>
            <span className="text-slate-500">
              ({completedCount} of {totalCount} tasks completed)
            </span>
          </div>
          <span className="font-bold text-slate-900 text-sm">
            {progressPercent}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isAllComplete
                ? 'bg-emerald-500'
                : progressPercent > 50
                ? 'bg-indigo-600'
                : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Congratulatory / Status Banner */}
        {isAllComplete ? (
          <div className="flex items-center gap-2 pt-1 text-xs text-emerald-800 font-medium">
            <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Outstanding work! All recommended tasks have been executed. Request re-crawling in Google Search Console.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>
              {pendingCount} remaining task{pendingCount === 1 ? '' : 's'} to complete
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll(true)}
                className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
              >
                Mark all complete
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleMarkAll(false)}
                className="text-slate-600 hover:text-slate-800 font-medium hover:underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-lg text-xs w-fit">
          {(['All', 'Pending', 'Completed'] as const).map(tab => {
            const count =
              tab === 'All'
                ? totalCount
                : tab === 'Pending'
                ? pendingCount
                : completedCount;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <span className="text-xs text-slate-400">
          Click any task or checkbox to toggle
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {visibleTasks.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-600 font-medium">
              No tasks found in the &ldquo;{filter}&rdquo; view.
            </p>
            {filter !== 'All' && (
              <button
                type="button"
                onClick={() => setFilter('All')}
                className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
              >
                View all tasks ({totalCount})
              </button>
            )}
          </div>
        ) : (
          visibleTasks.map(task => {
            const priorityInfo = getPriorityStyle(task.priority);

            return (
              <div
                key={task.id}
                onClick={() => handleToggle(task.id)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                  task.completed
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-500'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs text-slate-900'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {/* Interactive Checkbox */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleToggle(task.id);
                    }}
                    className="mt-0.5 shrink-0 focus:outline-none"
                    aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold leading-snug transition-all ${
                          task.completed
                            ? 'line-through text-slate-400 decoration-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.text}
                      </span>

                      <div
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${priorityInfo.badgeClass}`}
                      >
                        {priorityInfo.icon}
                        <span>{task.priority}</span>
                      </div>
                    </div>

                    {task.reason && (
                      <p
                        className={`text-xs leading-relaxed ${
                          task.completed ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        <span className="font-medium text-slate-700">Rationale: </span>
                        {task.reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions: delete if custom */}
                {task.isCustom && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors shrink-0"
                    title="Delete custom task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Task Form */}
      <form onSubmit={handleAddTask} className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={e => setNewTaskText(e.target.value)}
          placeholder="Add custom task (e.g., Update canonical URL, Add 3 internal links)..."
          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />

        <div className="flex items-center gap-2">
          <select
            value={newTaskPriority}
            onChange={e => setNewTaskPriority(e.target.value as any)}
            className="px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Custom">Custom</option>
          </select>

          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="px-3.5 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </form>
    </div>
  );
};
