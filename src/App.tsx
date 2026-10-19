/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { HeroIntro } from './components/HeroIntro';
import { AuditInputForm } from './components/AuditInputForm';
import { ScoreGauge } from './components/ScoreGauge';
import { PreAuditDiagnostics } from './components/PreAuditDiagnostics';
import { SuggestionsCard } from './components/SuggestionsCard';
import { SerpPreviewCard } from './components/SerpPreviewCard';
import { CompetitorComparisonCard } from './components/CompetitorComparisonCard';
import { HeadingsCard } from './components/HeadingsCard';
import { KeywordGapsCard } from './components/KeywordGapsCard';
import { ReadabilityCard } from './components/ReadabilityCard';
import { ActionPlanCard } from './components/ActionPlanCard';
import {
  calculateBrowserMetrics,
  generateMarkdownReport,
} from './utils/seoCalculations';
import { generatePdfReport } from './utils/pdfGenerator';
import { AuditResult, AuditRequestPayload } from './types/seo';
import {
  AlertCircle,
  FileDown,
  ArrowUp,
  RefreshCw,
  X,
  Copy,
  Sparkles,
  FileText,
  Activity,
} from 'lucide-react';

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

  // Active selection for interactive SERP preview
  const [selectedTitleIndex, setSelectedTitleIndex] = useState(0);
  const [selectedMetaIndex, setSelectedMetaIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Network abort and timeout management
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time on-page calculations computed entirely in browser before AI call
  const metrics = useMemo(() => {
    return calculateBrowserMetrics(content, targetKeyword, title);
  }, [content, targetKeyword, title]);

  const secKeywordsList = useMemo(() => {
    return secondaryKeywords
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }, [secondaryKeywords]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
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
    setSelectedTitleIndex(0);
    setSelectedMetaIndex(0);
    setError(null);
    setUrlError(null);
  };

  /**
   * Cancels any active audit or URL fetching request
   */
  const handleCancelAudit = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('USER_CANCELLED');
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setIsLoading(false);
    setIsFetchingUrl(false);
    setError('Audit was cancelled.');
  };

  /**
   * Fetches page content from a specified URL via Gemini's urlContext tool
   * with a 60-second AbortController timeout.
   */
  const handleFetchUrl = async (): Promise<{ title: string; metaDescription: string; content: string } | null> => {
    if (!pageUrl.trim()) return null;

    try {
      const parsed = new URL(pageUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        const msg = "Couldn't read that page, please paste the text instead";
        setUrlError(msg);
        setError(msg);
        return null;
      }
    } catch {
      const msg = "Couldn't read that page, please paste the text instead";
      setUrlError(msg);
      setError(msg);
      return null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort('TIMEOUT');
    }, 60000);
    timeoutIdRef.current = timeoutId;

    setIsFetchingUrl(true);
    setUrlError(null);

    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pageUrl.trim() }),
        signal: controller.signal,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || "Couldn't read that page, please paste the text instead";
        setUrlError(msg);
        setError(msg);
        setIsFetchingUrl(false);
        setIsLoading(false);
        return null;
      }

      if (data.title) setTitle(data.title);
      if (data.metaDescription) setMetaDescription(data.metaDescription);
      if (data.content) setContent(data.content);

      showToast('Page content fetched successfully.');
      return {
        title: data.title || '',
        metaDescription: data.metaDescription || '',
        content: data.content || '',
      };
    } catch (err: any) {
      const msg = isTimedOut
        ? "Couldn't read that page, please paste the text instead"
        : "Couldn't read that page, please paste the text instead";
      setUrlError(msg);
      setError(msg);
      setIsFetchingUrl(false);
      setIsLoading(false);
      return null;
    } finally {
      clearTimeout(timeoutId);
      if (timeoutIdRef.current === timeoutId) {
        timeoutIdRef.current = null;
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsFetchingUrl(false);
    }
  };

  /**
   * Submits the pre-calculated metrics and page text to Gemini for structured SEO audit
   * with a 60-second AbortController timeout and clean cancellation support.
   */
  const handleRunAudit = async () => {
    setError(null);
    setUrlError(null);

    let activeContent = content;
    let activeTitle = title;
    let activeMeta = metaDescription;

    if (!targetKeyword.trim()) {
      setError('A primary target keyword is required to benchmark the content.');
      return;
    }

    // Seamless URL-only flow: if content is empty but URL is provided, fetch first then continue
    if (!activeContent.trim()) {
      if (pageUrl.trim()) {
        setIsLoading(true);
        const fetched = await handleFetchUrl();
        if (!fetched || !fetched.content.trim()) {
          setIsLoading(false);
          setIsFetchingUrl(false);
          setError("Couldn't read that page, please paste the text instead");
          return;
        }
        activeContent = fetched.content;
        activeTitle = fetched.title;
        activeMeta = fetched.metaDescription;
      } else {
        setError('Please paste the page content or provide a page URL to audit.');
        setIsLoading(false);
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      controller.abort('TIMEOUT');
    }, 60000);
    timeoutIdRef.current = timeoutId;

    setIsLoading(true);

    try {
      // Compute browser heuristics for active content
      const activeMetrics = calculateBrowserMetrics(activeContent, targetKeyword.trim(), activeTitle);

      const payload: AuditRequestPayload = {
        pageContent: activeContent,
        title: activeTitle,
        metaDescription: activeMeta,
        targetKeyword: targetKeyword.trim(),
        secondaryKeywords: secKeywordsList,
        pageUrl: pageUrl.trim() || undefined,
        metrics: activeMetrics,
      };

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Couldn't complete the AI analysis. Your instant browser diagnostics are shown below.");
      }

      setAuditResult(data.audit);
      setSelectedTitleIndex(0);
      setSelectedMetaIndex(0);
      showToast('SEO audit completed successfully!');

      // Scroll smoothly to results section
      setTimeout(() => {
        document.getElementById('results-overview')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (err: any) {
      setIsLoading(false);
      if (err.name === 'AbortError' || controller.signal.aborted) {
        if (isTimedOut) {
          setError('The audit request timed out after 60 seconds. Please try again.');
        }
        return;
      }
      console.error('Audit execution error:', err);
      setError(
        err.message?.includes('Couldn') || err.message?.includes('rate limit')
          ? err.message
          : "Couldn't complete the AI analysis. Your instant browser diagnostics are shown below."
      );
    } finally {
      clearTimeout(timeoutId);
      if (timeoutIdRef.current === timeoutId) {
        timeoutIdRef.current = null;
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  /**
   * Generates and downloads the full audit report as a Markdown (.md) document
   */
  const handleDownloadReport = () => {
    if (!auditResult) return;

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
    showToast('Markdown report downloaded.');
  };

  /**
   * Generates and downloads the full audit report as a clean, publication-grade PDF document
   */
  const handleDownloadPdf = () => {
    if (!auditResult) return;

    generatePdfReport({
      title: title || 'Web Page SEO Audit',
      pageUrl: pageUrl.trim() || undefined,
      targetKeyword,
      secondaryKeywords: secKeywordsList,
      metrics,
      audit: auditResult,
    });

    showToast('PDF report generated and downloaded.');
  };

  /**
   * Copies the full audit report as Markdown to the user's clipboard
   */
  const handleCopyReport = () => {
    if (!auditResult) return;

    const markdown = generateMarkdownReport({
      title: title || 'Web Page SEO Audit',
      pageUrl: pageUrl || undefined,
      targetKeyword,
      secondaryKeywords: secKeywordsList,
      metrics,
      audit: auditResult,
    });

    navigator.clipboard.writeText(markdown);
    showToast('Full Markdown report copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in border border-slate-700">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        onDownloadReport={auditResult ? handleDownloadReport : undefined}
        onDownloadPdf={auditResult ? handleDownloadPdf : undefined}
        onCopyReport={auditResult ? handleCopyReport : undefined}
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
                <h4 className="text-sm font-bold">Notice</h4>
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
          onReset={handleReset}
          isLoading={isLoading}
          isFetchingUrl={isFetchingUrl}
          onFetchUrl={handleFetchUrl}
          urlError={urlError}
          onCancelAudit={handleCancelAudit}
        />

        {/* Instant Browser Diagnostics Section (Shown if Gemini/Fetch failed or while reviewing copy before audit) */}
        {!auditResult && (error || content.trim().length > 0) && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Instant Browser Diagnostics
                </h3>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  (Computed in real time from body text)
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Target: &ldquo;{targetKeyword || 'None'}&rdquo;
              </span>
            </div>
            <PreAuditDiagnostics
              metrics={metrics}
              targetKeyword={targetKeyword}
            />
          </div>
        )}

        {/* Comprehensive Audit Results Section */}
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

              <div className="flex flex-wrap items-center gap-2">
                {isLoading && (
                  <button
                    type="button"
                    onClick={handleCancelAudit}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Re-analyze
                </button>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Copy full Markdown report to clipboard"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Export Markdown report"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export Report (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  title="Download clean PDF report"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>

            {/* Score Gauge & 4-Pillar Score Breakdown */}
            <ScoreGauge
              score={auditResult.overall_score}
              verdict={auditResult.verdict}
              metrics={metrics}
              scoreBreakdown={auditResult.score_breakdown}
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
              currentTitle={title}
              currentMeta={metaDescription}
              selectedTitleIndex={selectedTitleIndex}
              selectedMetaIndex={selectedMetaIndex}
              onSelectTitle={setSelectedTitleIndex}
              onSelectMeta={setSelectedMetaIndex}
            />

            {/* Interactive SERP Preview Card */}
            <SerpPreviewCard
              pageUrl={pageUrl}
              targetKeyword={targetKeyword}
              selectedTitle={auditResult.title_suggestions[selectedTitleIndex] || auditResult.title_suggestions[0] || title}
              selectedMeta={auditResult.meta_description_suggestions[selectedMetaIndex] || auditResult.meta_description_suggestions[0] || metaDescription}
              suggestedSlug={auditResult.url_slug_suggestion}
              titleSuggestions={auditResult.title_suggestions}
              metaSuggestions={auditResult.meta_description_suggestions}
              onSelectTitle={(t) => {
                const idx = auditResult.title_suggestions.indexOf(t);
                if (idx !== -1) setSelectedTitleIndex(idx);
              }}
              onSelectMeta={(m) => {
                const idx = auditResult.meta_description_suggestions.indexOf(m);
                if (idx !== -1) setSelectedMetaIndex(idx);
              }}
            />

            {/* Competitor Comparison Section */}
            <CompetitorComparisonCard
              yourMetrics={metrics}
              yourTitle={title}
              yourMeta={metaDescription}
              yourUrl={pageUrl}
              targetKeyword={targetKeyword}
              onToast={showToast}
            />

            {/* Headings & Outline Recommendations */}
            <HeadingsCard
              headingRecommendations={auditResult.heading_recommendations}
              urlSlug={auditResult.url_slug_suggestion}
              targetKeyword={targetKeyword}
              currentHeadings={metrics.headingsList}
              h1Count={metrics.h1Count}
              headingsLogicalOrder={metrics.headingsLogicalOrder}
              headingIssues={metrics.headingIssues}
            />

            {/* Keyword Gaps & Search Intent Opportunities */}
            <KeywordGapsCard
              keywordGaps={auditResult.keyword_gaps}
              targetKeyword={targetKeyword}
              secondaryKeywords={secKeywordsList}
            />

            {/* Readability Improvements & Rewrites */}
            <ReadabilityCard
              notes={auditResult.readability_notes}
              content={content}
              metrics={metrics}
            />

            {/* Prioritized Action Plan */}
            <ActionPlanCard
              fixes={auditResult.fix_list}
            />

            {/* Bottom Download & Export Bar */}
            <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Export &amp; Share Complete SEO Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download a structured, publication-ready PDF or Markdown report, or copy to clipboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Top
                </button>

                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Report</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReport}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download Report (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
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
            <span>On-page SEO heuristics &amp; content strategy</span>
          </div>
          <div>
            Built with modern on-page diagnostics &amp; Gemini
          </div>
        </div>
      </footer>
    </div>
  );
}
