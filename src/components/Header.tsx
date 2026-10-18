/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SearchCheck, FileDown, Sparkles } from 'lucide-react';

interface HeaderProps {
  onLoadSample: () => void;
  onDownloadReport?: () => void;
  hasAuditResult: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onLoadSample,
  onDownloadReport,
  hasAuditResult,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <SearchCheck className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Page Auditor
          </span>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#audit-input" className="hover:text-slate-900 transition-colors whitespace-nowrap">
            Audit Tool
          </a>
          {hasAuditResult && (
            <>
              <a href="#results-overview" className="hover:text-slate-900 transition-colors whitespace-nowrap">
                Overview
              </a>
              <a href="#suggestions" className="hover:text-slate-900 transition-colors whitespace-nowrap">
                Metadata
              </a>
              <a href="#gaps" className="hover:text-slate-900 transition-colors whitespace-nowrap">
                Keywords
              </a>
              <a href="#readability" className="hover:text-slate-900 transition-colors whitespace-nowrap">
                Readability
              </a>
              <a href="#action-plan" className="hover:text-slate-900 transition-colors whitespace-nowrap">
                Fix List
              </a>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
            title="Load sample dental clinic page"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Load</span> Sample Page
          </button>

          {hasAuditResult && onDownloadReport && (
            <button
              type="button"
              onClick={onDownloadReport}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              Download Report
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
