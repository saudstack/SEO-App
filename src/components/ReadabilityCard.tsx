/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ReadabilityNote } from '../types/seo';
import { Sparkles, Copy, Check, ArrowRight } from 'lucide-react';

interface ReadabilityCardProps {
  notes: ReadabilityNote[];
}

export const ReadabilityCard: React.FC<ReadabilityCardProps> = ({ notes }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div id="readability" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Readability Improvements & Rewrites
            </h3>
            <p className="text-xs text-slate-500">
              Transform convoluted, dense sentences into plain, engaging copy
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums">
          {notes.length} Targeted Rewrites
        </span>
      </div>

      <div className="space-y-4">
        {notes.map((note, index) => {
          const isCopied = copiedIndex === index;

          return (
            <div
              key={index}
              className="p-4 rounded-lg border border-slate-200/90 bg-slate-50/40 hover:bg-white transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="p-3 rounded-md bg-rose-50/40 border border-rose-100">
                  <div className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Original Text (Dense / Passive)</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{note.original}&rdquo;
                  </p>
                </div>

                {/* Simplified Rewrite */}
                <div className="p-3 rounded-md bg-emerald-50/50 border border-emerald-100 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600" />
                        Simplified Rewrite
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyRewrite(note.rewrite, index)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
                          isCopied
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                        }`}
                        title="Copy rewritten text"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-medium text-slate-900 leading-relaxed">
                      &ldquo;{note.rewrite}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Rationale: </span>
                {note.reason}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
