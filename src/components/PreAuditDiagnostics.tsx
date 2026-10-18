/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserMetrics } from '../types/seo';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface PreAuditDiagnosticsProps {
  metrics: BrowserMetrics;
  targetKeyword: string;
}

export const PreAuditDiagnostics: React.FC<PreAuditDiagnosticsProps> = ({
  metrics,
  targetKeyword,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            On-Page Pre-Calculated Diagnostics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Computed locally in your browser before AI intent processing
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          Target: &ldquo;{targetKeyword || 'None'}&rdquo;
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Content Length & Sentences */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Content Volume
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {metrics.wordCount} <span className="text-xs font-normal text-slate-500">words</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>{metrics.sentenceCount} sentences</span>
            <span className="font-mono tabular-nums">{metrics.avgSentenceLength} w/sent</span>
          </div>
          {metrics.thinContentWarning && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-amber-700 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
              <span>Under 100 words: Thin content penalty</span>
            </div>
          )}
        </div>

        {/* Readability & Flesch */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Flesch Reading Ease
          </span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {metrics.fleschScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
            <span>Label:</span>
            <span className="font-semibold text-slate-800">{metrics.fleschLabel}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
            {metrics.fleschScore >= 70
              ? 'Plain English accessible to standard audiences.'
              : metrics.fleschScore >= 55
              ? 'Standard complexity for technical/commercial content.'
              : 'Dense vocabulary with lengthy sentence structures.'}
          </div>
        </div>

        {/* Keyword Placement Heuristics */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Keyword Placements
          </span>
          <ul className="mt-2 space-y-1.5 text-xs">
            <li className="flex items-center justify-between">
              <span className="text-slate-600">In Title Tag:</span>
              {metrics.inTitle ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes
                </span>
              ) : (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" /> Missing
                </span>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">First 100 Words:</span>
              {metrics.inFirst100 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Yes
                </span>
              ) : (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Missing
                </span>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">In Headings:</span>
              {metrics.inHeadings ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Present
                </span>
              ) : (
                <span className="text-amber-700 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Missing
                </span>
              )}
            </li>
          </ul>
        </div>

        {/* Heading Hierarchy Check */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Heading Hierarchy
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-slate-800">
              {metrics.h1Count === 1 ? '1 Main H1 Tag' : `${metrics.h1Count} H1 Tags`}
            </span>
            {metrics.h1Count === 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between">
            <span className="text-slate-600">Order Logic:</span>
            <span className={`font-semibold ${metrics.headingsLogicalOrder ? 'text-emerald-700' : 'text-rose-600'}`}>
              {metrics.headingsLogicalOrder ? 'Sequential' : 'Broken Order'}
            </span>
          </div>
          {metrics.headingIssues.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-rose-700 leading-tight">
              {metrics.headingIssues[0]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
