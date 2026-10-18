/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Type, AlignLeft } from 'lucide-react';

interface SuggestionsCardProps {
  titleSuggestions: string[];
  metaSuggestions: string[];
}

export const SuggestionsCard: React.FC<SuggestionsCardProps> = ({
  titleSuggestions,
  metaSuggestions,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div id="suggestions" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Title Tag Suggestions (< 60 chars) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Type className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  SEO Title Tag Suggestions
                </h3>
                <p className="text-xs text-slate-500">
                  Strictly optimized under 60 characters for SERP display
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">Max 60 Chars</span>
          </div>

          <div className="space-y-3">
            {titleSuggestions.map((title, index) => {
              const charCount = title.length;
              const isOver = charCount > 60;
              const copyId = `title-${index}`;
              const isCopied = copiedIndex === copyId;

              return (
                <div
                  key={index}
                  className="group relative p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {title}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(title, copyId)}
                      className={`shrink-0 p-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                      }`}
                      title="Copy to clipboard"
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

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] font-medium text-slate-400">
                      Option {index + 1}
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums font-medium ${
                        isOver
                          ? 'text-rose-600'
                          : charCount >= 50
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {charCount} / 60 characters
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meta Description Suggestions (< 155 chars) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <AlignLeft className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Meta Description Suggestions
                </h3>
                <p className="text-xs text-slate-500">
                  Optimized under 155 characters with persuasive click triggers
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono">Max 155 Chars</span>
          </div>

          <div className="space-y-3">
            {metaSuggestions.map((meta, index) => {
              const charCount = meta.length;
              const isOver = charCount > 155;
              const copyId = `meta-${index}`;
              const isCopied = copiedIndex === copyId;

              return (
                <div
                  key={index}
                  className="group relative p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      &ldquo;{meta}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopy(meta, copyId)}
                      className={`shrink-0 p-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                      }`}
                      title="Copy to clipboard"
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

                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span className="text-[11px] font-medium text-slate-400">
                      Option {index + 1}
                    </span>
                    <span
                      className={`font-mono text-xs tabular-nums font-medium ${
                        isOver
                          ? 'text-rose-600'
                          : charCount >= 130
                          ? 'text-emerald-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {charCount} / 155 characters
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
