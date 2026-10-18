/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FixItem } from '../types/seo';
import { ListChecks, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ActionPlanCardProps {
  fixes: FixItem[];
}

export const ActionPlanCard: React.FC<ActionPlanCardProps> = ({ fixes }) => {
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

  return (
    <div id="action-plan" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Prioritized Action Plan
            </h3>
            <p className="text-xs text-slate-500">
              Recommended roadmap to lift keyword rankings and search CTR
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {fixes.length} Tasks
        </span>
      </div>

      <div className="space-y-3">
        {fixes.map((fix, index) => {
          const badge = getPriorityBadge(fix.priority);

          return (
            <div
              key={index}
              className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
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
                    <span className="font-medium text-slate-700">Impact: </span>
                    {fix.reason}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
