/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Copy, Check, Type, AlignLeft, Sparkles } from 'lucide-react';

interface SuggestionsCardProps {
  titleSuggestions: string[];
  metaSuggestions: string[];
  currentTitle?: string;
  currentMeta?: string;
  selectedTitleIndex?: number;
  selectedMetaIndex?: number;
  onSelectTitle?: (index: number) => void;
  onSelectMeta?: (index: number) => void;
}

export const SuggestionsCard: React.FC<SuggestionsCardProps> = ({
  titleSuggestions,
  metaSuggestions,
  currentTitle,
  currentMeta,
  selectedTitleIndex = 0,
  selectedMetaIndex = 0,
  onSelectTitle,
  onSelectMeta,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyAll = (items: string[], type: 'titles' | 'metas') => {
    const text = items.map((item, idx) => `Option ${idx + 1}: ${item}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedId(`all-${type}`);
    setTimeout(() => setCopiedId(null), 2000);
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
                  Click-worthy titles strictly optimized under 60 characters
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyAll(titleSuggestions, 'titles')}
              className={`px-2.5 py-1 text-xs font-medium border rounded-md transition-colors flex items-center gap-1 ${
                copiedId === 'all-titles'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Copy all 3 title options"
            >
              {copiedId === 'all-titles' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied All</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy All</span>
                </>
              )}
            </button>
          </div>

          {currentTitle && (
            <div className="mb-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Current Title Tag
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {currentTitle.length} / 60 chars
                </span>
              </div>
              <p className="font-medium text-slate-800 truncate">{currentTitle}</p>
            </div>
          )}

          <div className="space-y-3">
            {titleSuggestions.map((title, index) => {
              const charCount = title.length;
              const isOver = charCount > 60;
              const copyId = `title-${index}`;
              const isCopied = copiedId === copyId;
              const isSelected = selectedTitleIndex === index;

              return (
                <div
                  key={index}
                  onClick={() => onSelectTitle?.(index)}
                  className={`group relative p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20'
                      : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {title}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(title, copyId);
                      }}
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
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <span>Option {index + 1}</span>
                      {isSelected && (
                        <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> Active in Preview
                        </span>
                      )}
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
                  Persuasive descriptions strictly under 155 characters with CTA
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyAll(metaSuggestions, 'metas')}
              className={`px-2.5 py-1 text-xs font-medium border rounded-md transition-colors flex items-center gap-1 ${
                copiedId === 'all-metas'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="Copy all 3 meta options"
            >
              {copiedId === 'all-metas' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied All</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy All</span>
                </>
              )}
            </button>
          </div>

          {currentMeta && (
            <div className="mb-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Current Meta Description
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {currentMeta.length} / 155 chars
                </span>
              </div>
              <p className="font-medium text-slate-800 line-clamp-2">{currentMeta}</p>
            </div>
          )}

          <div className="space-y-3">
            {metaSuggestions.map((meta, index) => {
              const charCount = meta.length;
              const isOver = charCount > 155;
              const copyId = `meta-${index}`;
              const isCopied = copiedId === copyId;
              const isSelected = selectedMetaIndex === index;

              return (
                <div
                  key={index}
                  onClick={() => onSelectMeta?.(index)}
                  className={`group relative p-3.5 rounded-lg border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500/20'
                      : 'border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      &ldquo;{meta}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(meta, copyId);
                      }}
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
                    <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                      <span>Option {index + 1}</span>
                      {isSelected && (
                        <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3" /> Active in Preview
                        </span>
                      )}
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
