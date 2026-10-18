/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FixItem } from '../types/seo';
import { ListChecks, AlertCircle, AlertTriangle, Info, Copy, Check } from 'lucide-react';

interface ActionPlanCardProps {
  fixes: FixItem[];
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({ fixes }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyChecklist = () => {
    const markdown = fixes
      .map(fix => `- [ ] **[${fix.priority.toUpperCase()}]** ${fix.action}\n  - *Impact:* ${fix.reason}`)
      .join('\n\n');
    navigator.clipboard.writeText(markdown);
    setCopiedId('checklist');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadge = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
          labelClass: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      case 'Medium':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
          labelClass: 'text-amber-800 bg-amber-50 border-amber-200',
        };
      case 'Low':
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-slate-600" />,
          labelClass: 'text-slate-700 bg-slate-100 border-slate-200',
        };
    }
  };

  const filteredFixes = fixes.filter(fix => {
    if (filterPriority === 'All') return true;
    return fix.priority === filterPriority;
  });

  return (
    <div id="action-plan" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Prioritized Action Plan &amp; Recommendations
            </h3>
            <p className="text-xs text-slate-500">
              Actionable SEO roadmap with impact rationales ready to paste into task trackers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyChecklist}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 ${
              copiedId === 'checklist'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Copy all tasks as Markdown checkboxes for Jira, Linear, or Notion"
          >
            {copiedId === 'checklist' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied Checklist</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy as Checklist</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Priority Filter Tabs */}
      <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-lg text-xs w-fit">
        {(['All', 'High', 'Medium', 'Low'] as const).map(p => {
          const count = p === 'All' ? fixes.length : fixes.filter(f => f.priority === p).length;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filterPriority === p
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p} ({count})
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredFixes.map((fix, index) => {
          const badge = getPriorityBadge(fix.priority);
          const copyId = `fix-${index}`;
          const isCopied = copiedId === copyId;

          return (
            <div
              key={index}
              className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`px-2 py-0.5 rounded text-xs font-semibold border flex items-center gap-1 shrink-0 ${badge.labelClass}`}
                >
                  {badge.icon}
                  <span>{fix.priority}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {fix.action}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-medium text-slate-700">Reason / Impact: </span>
                    {fix.reason}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(`[${fix.priority}] ${fix.action} - ${fix.reason}`, copyId)}
                className={`shrink-0 p-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                  isCopied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                }`}
                title="Copy action item"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
