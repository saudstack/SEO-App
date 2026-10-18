/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HeadingRecommendations, HeadingItem } from '../types/seo';
import {
  Heading,
  Copy,
  Check,
  FolderTree,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Sparkles,
} from 'lucide-react';

interface HeadingsCardProps {
  headingRecommendations?: HeadingRecommendations;
  urlSlug?: string;
  targetKeyword: string;
  currentHeadings?: HeadingItem[];
  h1Count?: number;
  headingsLogicalOrder?: boolean;
  headingIssues?: string[];
}

export const HeadingsCard: React.FC<HeadingsCardProps> = ({
  headingRecommendations,
  urlSlug,
  targetKeyword,
  currentHeadings = [],
  h1Count = 0,
  headingsLogicalOrder = true,
  headingIssues = [],
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCurrentHeadings, setShowCurrentHeadings] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const h1Suggestion = headingRecommendations?.h1_suggestion || '';
  const outline = headingRecommendations?.recommended_outline || [];

  // Generate full markdown outline representation
  const markdownOutline = [
    `# ${h1Suggestion || targetKeyword}`,
    '',
    ...outline.map(item => {
      const prefix = item.level === 'H2' ? '##' : '###';
      return `${prefix} ${item.heading}\n<!-- Purpose: ${item.purpose} -->`;
    }),
  ].join('\n\n');

  return (
    <div id="headings" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header with Title and Outline Copy Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Heading className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Heading Structure & Content Outline
            </h3>
            <p className="text-xs text-slate-500">
              H1 targeting, search-intent hierarchy, and recommended topical sections
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(markdownOutline, 'all-outline')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 ${
              copiedId === 'all-outline'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Copy complete heading hierarchy as Markdown"
          >
            {copiedId === 'all-outline' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied Markdown</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Outline as Markdown</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recommended Primary H1 Banner */}
      <div className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/40">
        <div className="flex items-center justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-600 text-white">
              Recommended H1
            </span>
            <span className="text-xs text-slate-600">
              Optimized for primary search query &amp; page intent
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(h1Suggestion, 'h1')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 ${
              copiedId === 'h1'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {copiedId === 'h1' ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy H1</span>
              </>
            )}
          </button>
        </div>

        <div className="text-lg sm:text-xl font-bold text-slate-900 mt-2 font-sans tracking-tight">
          {h1Suggestion || targetKeyword}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-2 border-t border-indigo-100/70">
          <span className="font-mono">{h1Suggestion.length} characters</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Includes keyword: &ldquo;{targetKeyword}&rdquo;
          </span>
          {urlSlug && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono text-slate-600">
                <Link2 className="w-3 h-3 text-slate-400" />
                Slug: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">{urlSlug}</code>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Recommended Outline Tree */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recommended Topical Hierarchy (H2 / H3 Outline)</span>
          </h4>
          <span className="text-xs text-slate-500 font-mono">
            {outline.length} Sections
          </span>
        </div>

        <div className="space-y-2.5">
          {outline.map((item, index) => {
            const isH2 = item.level === 'H2';
            const copyId = `outline-${index}`;
            const isCopied = copiedId === copyId;

            return (
              <div
                key={index}
                className={`p-3.5 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isH2
                    ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    : 'bg-white border-slate-200/80 ml-0 sm:ml-6 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 mt-0.5 ${
                      isH2
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {item.level}
                  </span>

                  <div>
                    <h5 className="text-sm font-semibold text-slate-900 leading-snug">
                      {item.heading}
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-600">Intent Purpose: </span>
                      {item.purpose}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(item.heading, copyId)}
                  className={`shrink-0 p-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1 ${
                    isCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Copy heading text"
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
            );
          })}
        </div>
      </div>

      {/* Current Headings Diagnostic Accordion */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowCurrentHeadings(!showCurrentHeadings)}
          className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 py-1 font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            {h1Count === 1 && headingsLogicalOrder ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>
              Current Page Headings Audit ({currentHeadings.length} found · {h1Count} H1 · {headingsLogicalOrder ? 'Logical order' : 'Hierarchy issues'})
            </span>
          </span>
          <span className="text-indigo-600 font-semibold">
            {showCurrentHeadings ? 'Hide Details' : 'View Current Headings'}
          </span>
        </button>

        {showCurrentHeadings && (
          <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            {headingIssues.length > 0 && (
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 space-y-1">
                <span className="font-semibold block">Issues Identified:</span>
                {headingIssues.map((issue, idx) => (
                  <p key={idx} className="text-xs">· {issue}</p>
                ))}
              </div>
            )}

            {currentHeadings.length === 0 ? (
              <p className="text-slate-500 italic">No headings detected in pasted page copy.</p>
            ) : (
              <div className="space-y-1.5 font-mono text-slate-700">
                {currentHeadings.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold text-[10px]">
                      H{h.level}
                    </span>
                    <span className="text-slate-800">{h.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
