/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroIntro } from './components/HeroIntro';
import { AuditInputForm } from './components/AuditInputForm';
import { ScoreGauge } from './components/ScoreGauge';
import { PreAuditDiagnostics } from './components/PreAuditDiagnostics';
import { SuggestionsCard } from './components/SuggestionsCard';
import { KeywordGapsCard } from './components/KeywordGapsCard';
import { ReadabilityCard } from './components/ReadabilityCard';
import { ActionPlanCard } from './components/ActionPlanCard';
import {
  calculateBrowserMetrics,
  SAMPLE_DOHA_PAGE,
  generateMarkdownReport,
} from './utils/seoCalculations';
import { AuditResult } from './types/seo';
import { AlertCircle, FileDown, ArrowUp, RefreshCw } from 'lucide-react';

export default function App() {
  // Page Input States
  const [pageUrl, setPageUrl] = useState('');
  const [targetKeyword, setTargetKeyword] = useState('');
  const [secondaryKeywords, setSecondaryKeywords] = useState('');
  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [content, setContent] = useState('');

  // Processing & Network States
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Real-time on-page calculations computed entirely in browser before AI call
  const metrics = useMemo(() => {
    return calculateBrowserMetrics(content, targetKeyword, title);
  }, [content, targetKeyword, title]);

  /**
   * Loads the realistic sample Doha Dental Clinic page with intentional SEO deficiencies:
   * thin title, missing meta, skipped heading hierarchy, low word count.
   */
  const handleLoadSample = () => {
    setPageUrl(SAMPLE_DOHA_PAGE.url);
    setTitle(SAMPLE_DOHA_PAGE.title);
    setMetaDescription(SAMPLE_DOHA_PAGE.metaDescription);
    setTargetKeyword(SAMPLE_DOHA_PAGE.targetKeyword);
    setSecondaryKeywords(SAMPLE_DOHA_PAGE.secondaryKeywords);
    setContent(SAMPLE_DOHA_PAGE.content);
    setError(null);
    setUrlError(null);
  };

  /**
   * Clears form inputs and previous audit results
   */
  const handleReset = () => {
    setPageUrl('');
    setTargetKeyword('');
    setSecondaryKeywords('');
    setTitle('');
    setMetaDescription('');
    setContent('');
    setAuditResult(null);
    setError(null);
    setUrlError(null);
  };

  /**
   * Fetches page content from a specified URL via Gemini's urlContext tool
   */
  const handleFetchUrl = async () => {
    if (!pageUrl.trim()) return;

    setIsFetchingUrl(true);
    setUrlError(null);

    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pageUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUrlError(
          data.error ||
            'Could not read page from this URL. Please paste the page content directly into the text area.'
        );
        return;
      }

      if (data.title) setTitle(data.title);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
      if (data.content) setContent(data.content);
    } catch (err: any) {
      setUrlError(
        'Could not read page from this URL. Please paste the page content directly into the text area.'
      );
    } finally {
      setIsFetchingUrl(false);
    }
  };

  /**
   * Submits the pre-calculated metrics and page text to Gemini for structured SEO audit
   */
  const handleRunAudit = async () => {
    setError(null);

    // Validate inputs
    if (!content.trim()) {
      if (pageUrl.trim()) {
        // If user entered URL but no content, try fetching first
        await handleFetchUrl();
        return;
      }
      setError('Please paste the page content into the text area to audit.');
      return;
    }

    if (!targetKeyword.trim()) {
      setError('A primary target keyword is required to benchmark the content.');
      return;
    }

    setIsLoading(true);

    try {
      const secKeywordsList = secondaryKeywords
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageContent: content,
          title,
          metaDescription,
          targetKeyword: targetKeyword.trim(),
          secondaryKeywords: secKeywordsList,
          pageUrl: pageUrl.trim() || undefined,
          metrics,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete the SEO audit.');
      }

      setAuditResult(data.audit);

      // Scroll smoothly to results section
      setTimeout(() => {
        document.getElementById('results-overview')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setError(
        err.message ||
          'An unexpected error occurred while communicating with the audit service. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Generates and downloads the full audit report as a Markdown (.md) document
   */
  const handleDownloadReport = () => {
    if (!auditResult) return;

    const secKeywordsList = secondaryKeywords
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const markdown = generateMarkdownReport({
      title: title || 'Web Page SEO Audit',
      pageUrl: pageUrl || undefined,
      targetKeyword,
      secondaryKeywords: secKeywordsList,
      metrics,
      audit: auditResult,
    });

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `page-audit-${targetKeyword.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'report'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        onLoadSample={handleLoadSample}
        onDownloadReport={auditResult ? handleDownloadReport : undefined}
        hasAuditResult={!!auditResult}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Intro */}
        <HeroIntro />

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Audit Issue Encountered</h4>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs text-rose-600 hover:text-rose-900 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Audit Inputs Form */}
        <AuditInputForm
          pageUrl={pageUrl}
          setPageUrl={setPageUrl}
          targetKeyword={targetKeyword}
          setTargetKeyword={setTargetKeyword}
          secondaryKeywords={secondaryKeywords}
          setSecondaryKeywords={setSecondaryKeywords}
          title={title}
          setTitle={setTitle}
          metaDescription={metaDescription}
          setMetaDescription={setMetaDescription}
          content={content}
          setContent={setContent}
          metrics={metrics}
          onAudit={handleRunAudit}
          onLoadSample={handleLoadSample}
          onReset={handleReset}
          isLoading={isLoading}
          isFetchingUrl={isFetchingUrl}
          onFetchUrl={handleFetchUrl}
          urlError={urlError}
        />

        {/* Audit Results Section */}
        {auditResult && (
          <div id="results-overview" className="mt-12 space-y-8 scroll-mt-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                  <span>Audit Complete</span>
                  <span className="text-slate-300" aria-hidden="true">·</span>
                  <span className="text-slate-500 font-normal">Target: &ldquo;{targetKeyword}&rdquo;</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Comprehensive SEO Report
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Re-analyze
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download Report (.md)
                </button>
              </div>
            </div>

            {/* Score Gauge & Summary Matrix */}
            <ScoreGauge
              score={auditResult.overall_score}
              verdict={auditResult.verdict}
              metrics={metrics}
            />

            {/* Pre-Audit Diagnostics Card */}
            <PreAuditDiagnostics
              metrics={metrics}
              targetKeyword={targetKeyword}
            />

            {/* Title & Meta Description Suggestions Card */}
            <SuggestionsCard
              titleSuggestions={auditResult.title_suggestions}
              metaSuggestions={auditResult.meta_description_suggestions}
            />

            {/* Keyword Gaps & Search Intent Opportunities */}
            <KeywordGapsCard
              keywordGaps={auditResult.keyword_gaps}
            />

            {/* Readability Improvements & Rewrites */}
            <ReadabilityCard
              notes={auditResult.readability_notes}
            />

            {/* Prioritized Action Plan */}
            <ActionPlanCard
              fixes={auditResult.fix_list}
            />

            {/* Bottom Download Bar */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Export Complete Audit Report
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download a structured, publication-ready Markdown file including all suggestions and heuristics.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Back to Top
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Download Report (.md)
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Page Auditor</span>
            <span>·</span>
            <span>On-page SEO heuristics & content strategy</span>
          </div>
          <div>
            Built with modern on-page diagnostics &amp; Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
