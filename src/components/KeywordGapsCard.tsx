/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeywordGap } from '../types/seo';
import { Compass, HelpCircle, Hash, Copy, Check, Filter } from 'lucide-react';

interface KeywordGapsCardProps {
  keywordGaps: KeywordGap[];
  targetKeyword?: string;
  secondaryKeywords?: string[];
}

export const KeywordGapsCard: React.FC<KeywordGapsCardProps> = ({
  keywordGaps,
  targetKeyword,
  secondaryKeywords = [],
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'term' | 'question'>('all');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = (format: 'comma' | 'list') => {
    const items = keywordGaps.map(g => g.termOrQuestion);
    const text = format === 'comma' ? items.join(', ') : items.map(k => `- ${k}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(`all-${format}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGaps = keywordGaps.filter(gap => {
    if (filterType === 'all') return true;
    return gap.type === filterType;
  });

  const termCount = keywordGaps.filter(g => g.type === 'term').length;
  const questionCount = keywordGaps.filter(g => g.type === 'question').length;

  return (
    <div id="gaps" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      {/* Header with Title and Copy All Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Keyword Gaps & Search Intent Opportunities
            </h3>
            <p className="text-xs text-slate-500">
              High-value topical entities and user search questions missing from this page
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopyAll('comma')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 ${
              copiedId === 'all-comma'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Copy as comma-separated list for keyword research tools"
          >
            {copiedId === 'all-comma' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied CSV</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy as CSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleCopyAll('list')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 ${
              copiedId === 'all-list'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Copy as bullet list for content briefs"
          >
            {copiedId === 'all-list' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied List</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy List</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center p-0.5 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Opportunities ({keywordGaps.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('term')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filterType === 'term'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Hash className="w-3 h-3 text-emerald-600" />
            <span>Entities & Terms ({termCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType('question')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filterType === 'question'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3 h-3 text-indigo-600" />
            <span>User Questions ({questionCount})</span>
          </button>
        </div>

        {targetKeyword && (
          <span className="text-slate-500 font-mono text-[11px]">
            Benchmarked against: &ldquo;{targetKeyword}&rdquo;
          </span>
        )}
      </div>

      {/* Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredGaps.map((gap, index) => {
          const isQuestion = gap.type === 'question' || gap.termOrQuestion.includes('?');
          const copyId = `gap-${index}`;
          const isCopied = copiedId === copyId;

          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {isQuestion ? (
                      <span className="text-indigo-700 flex items-center gap-1 font-semibold">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                        User Search Question
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                        <Hash className="w-3.5 h-3.5 text-emerald-600" />
                        Semantic Topic / Entity
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(gap.termOrQuestion, copyId)}
                    className={`shrink-0 p-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                      isCopied
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                    }`}
                    title="Copy keyword"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                  {gap.termOrQuestion}
                </h4>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-700">Intent & Ranking Reason: </span>
                {gap.reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
