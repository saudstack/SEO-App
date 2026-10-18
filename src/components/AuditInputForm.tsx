/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BrowserMetrics } from '../types/seo';
import {
  Globe,
  KeyRound,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react';

interface AuditInputFormProps {
  pageUrl: string;
  setPageUrl: (val: string) => void;
  targetKeyword: string;
  setTargetKeyword: (val: string) => void;
  secondaryKeywords: string;
  setSecondaryKeywords: (val: string) => void;
  title: string;
  setTitle: (val: string) => void;
  metaDescription: string;
  setMetaDescription: (val: string) => void;
  content: string;
  setContent: (val: string) => void;
  metrics: BrowserMetrics;
  onAudit: () => void;
  onLoadSample: () => void;
  onReset: () => void;
  isLoading: boolean;
  isFetchingUrl: boolean;
  onFetchUrl: () => void;
  urlError: string | null;
  onCancelAudit?: () => void;
}

export const AuditInputForm: React.FC<AuditInputFormProps> = ({
  pageUrl,
  setPageUrl,
  targetKeyword,
  setTargetKeyword,
  secondaryKeywords,
  setSecondaryKeywords,
  title,
  setTitle,
  metaDescription,
  setMetaDescription,
  content,
  setContent,
  metrics,
  onAudit,
  onLoadSample,
  onReset,
  isLoading,
  isFetchingUrl,
  onFetchUrl,
  urlError,
  onCancelAudit,
}) => {
  const [showMetadataInputs, setShowMetadataInputs] = useState(false);

  return (
    <div id="audit-input" className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Page Information & Copy
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Provide your page copy and target keyword to run real-time heuristics and AI audit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Load Sample Page
          </button>
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Clear all fields"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          onAudit();
        }}
        className="mt-6 space-y-6"
      >
        {/* URL Input (Optional) */}
        <div>
          <label htmlFor="page-url" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Page URL (Optional)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                id="page-url"
                type="url"
                value={pageUrl}
                onChange={e => setPageUrl(e.target.value)}
                placeholder="https://example.com/services/orthodontics"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
              />
            </div>
            {pageUrl.trim() && (
              <button
                type="button"
                onClick={onFetchUrl}
                disabled={isFetchingUrl || isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
              >
                {isFetchingUrl ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    Fetching Page...
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Fetch from URL
                  </>
                )}
              </button>
            )}
          </div>
          {urlError && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {urlError}
            </p>
          )}
        </div>

        {/* Keyword Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Keyword (Required) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="target-keyword" className="block text-xs font-semibold text-slate-700">
                Primary Target Keyword <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Required</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-indigo-500" />
              </div>
              <input
                id="target-keyword"
                type="text"
                required
                value={targetKeyword}
                onChange={e => setTargetKeyword(e.target.value)}
                placeholder="e.g. dentist in doha"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Secondary Keywords (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="secondary-keywords" className="block text-xs font-semibold text-slate-700">
                Secondary Keywords (Optional)
              </label>
              <span className="text-[11px] text-slate-400">2-3 terms, comma-separated</span>
            </div>
            <input
              id="secondary-keywords"
              type="text"
              value={secondaryKeywords}
              onChange={e => setSecondaryKeywords(e.target.value)}
              placeholder="teeth whitening doha, dental clinic qatar"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900"
            />
          </div>
        </div>

        {/* Toggle Optional Title & Meta Description Inputs */}
        <div>
          <button
            type="button"
            onClick={() => setShowMetadataInputs(!showMetadataInputs)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {showMetadataInputs ? 'Hide' : 'Specify'} Existing Page Title & Meta Description
            </span>
          </button>

          {showMetadataInputs && (
            <div className="mt-3 p-4 rounded-lg bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="existing-title" className="block text-xs font-medium text-slate-600 mb-1">
                  Existing Title Tag
                </label>
                <input
                  id="existing-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Home - Dental Clinic"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="existing-meta" className="block text-xs font-medium text-slate-600 mb-1">
                  Existing Meta Description
                </label>
                <input
                  id="existing-meta"
                  type="text"
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                  placeholder="e.g. Dental care in Doha for the whole family..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Page Content Text Area */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="page-content" className="block text-xs font-semibold text-slate-700">
              Page Content (Headings & Body Copy) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Markdown or plain text</span>
              <span className="font-mono tabular-nums">{metrics.wordCount} words</span>
            </div>
          </div>
          <div className="relative">
            <textarea
              id="page-content"
              required
              rows={9}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste the full web page copy here (including headings like # or <h1> and body paragraphs)..."
              className="w-full p-3.5 text-sm font-sans bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 leading-relaxed font-normal"
            />
          </div>

          {/* Quick Pre-Audit Browser Heuristics Bar */}
          {content.trim() && (
            <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-mono tabular-nums font-medium text-slate-900">
                  {metrics.wordCount} words
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>
                  Flesch score: <strong className="font-mono text-slate-800">{metrics.fleschScore}</strong> ({metrics.fleschLabel})
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>
                  Target keyword density: <strong className="font-mono text-slate-800">{metrics.keywordDensity}%</strong> ({metrics.keywordCount} times)
                </span>
                <span className="text-slate-300" aria-hidden="true">·</span>
                <span>
                  H1 tags: <strong className="font-mono text-slate-800">{metrics.h1Count}</strong>
                </span>
              </div>

              {metrics.thinContentWarning && (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Short content (&lt;100 words)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 hidden sm:block">
            Audits evaluate topical depth, readability, heading logic, and SERP CTR.
          </p>

          <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
            {isLoading && onCancelAudit && (
              <button
                type="button"
                onClick={onCancelAudit}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel Audit</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || (!content.trim() && !pageUrl.trim()) || !targetKeyword.trim()}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running Audit...</span>
                </>
              ) : (
                <>
                  <span>Run SEO Audit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
