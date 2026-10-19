/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SearchCheck, FileDown, Sparkles, Copy, Check, FileJson } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onDownloadReport?: () => void;
  onDownloadJson?: () => void;
  onCopyReport?: () => void;
  hasAuditResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onDownloadReport,
  onDownloadJson,
  onCopyReport,
  hasAuditResult,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);

  const handleCopy = () => {
    if (onCopyReport) {
      onCopyReport();
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <SearchCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
              Page Auditor
            </span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:inline mt-0.5">
              Structured On-Page SEO &amp; Heuristics
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <a href="#audit-input" className="hover:text-slate-900 transition-colors">
            Audit Tool
          </a>
          {hasAuditResult && (
            <>
              <a href="#results-overview" className="hover:text-slate-900 transition-colors">
                Score &amp; Overview
              </a>
              <a href="#suggestions" className="hover:text-slate-900 transition-colors">
                Title &amp; Meta
              </a>
              <a href="#serp-preview" className="hover:text-slate-900 transition-colors">
                SERP Preview
              </a>
              <a href="#competitor-comparison" className="hover:text-slate-900 transition-colors">
                Competitor
              </a>
              <a href="#headings" className="hover:text-slate-900 transition-colors">
                Headings
              </a>
              <a href="#gaps" className="hover:text-slate-900 transition-colors">
                Keywords
              </a>
              <a href="#readability" className="hover:text-slate-900 transition-colors">
                Readability
              </a>
              <a href="#action-plan" className="hover:text-slate-900 transition-colors">
                Fixes
              </a>
              <a href="#checklist" className="hover:text-slate-900 transition-colors">
                Checklist
              </a>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Load sample dental clinic page"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Load</span> Sample
          </button>

          {hasAuditResult && (
            <>
              {onCopyReport && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors hidden sm:flex items-center gap-1.5 ${
                    copiedReport
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Copy full audit report as Markdown"
                >
                  {copiedReport ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>
              )}

              {onDownloadJson && (
                <button
                  type="button"
                  onClick={onDownloadJson}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors hidden md:flex items-center gap-1 shadow-xs"
                  title="Download raw audit JSON"
                >
                  <FileJson className="w-3.5 h-3.5 text-slate-600" />
                  <span>JSON</span>
                </button>
              )}

              {onDownloadReport && (
                <button
                  type="button"
                  onClick={onDownloadReport}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Export Report</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};
