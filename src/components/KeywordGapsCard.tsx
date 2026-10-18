/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KeywordGap } from '../types/seo';
import { Compass, HelpCircle, Hash } from 'lucide-react';

interface KeywordGapsCardProps {
  keywordGaps: KeywordGap[];
}

export const KeywordGapsCard: React.FC<KeywordGapsCardProps> = ({ keywordGaps }) => {
  return (
    <div id="gaps" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Keyword Gaps & Search Intent Opportunities
            </h3>
            <p className="text-xs text-slate-500">
              High-value topics and user search questions not adequately covered on this page
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {keywordGaps.length} Opportunities Identified
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {keywordGaps.map((gap, index) => {
          const isQuestion = gap.type === 'question' || gap.termOrQuestion.includes('?');

          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 text-xs font-medium mb-1.5">
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
                <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                  {gap.termOrQuestion}
                </h4>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-700">Why cover this: </span>
                {gap.reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
