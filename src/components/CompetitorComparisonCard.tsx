/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Swords,
  Globe,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trophy,
  Zap,
  Equal,
  FileText,
  BookOpen,
  Hash,
  Layers,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import { BrowserMetrics, CompetitorData } from '../types/seo';
import {
  calculateBrowserMetrics,
  SAMPLE_COMPETITOR_PAGE,
  buildCompetitorComparison,
  generateCompetitorMarkdownReport,
} from '../utils/seoCalculations';

interface CompetitorComparisonCardProps {
  yourMetrics: BrowserMetrics;
  yourTitle: string;
  yourMeta: string;
  yourUrl?: string;
  targetKeyword: string;
  onToast?: (msg: string) => void;
}

export function CompetitorComparisonCard({
  yourMetrics,
  yourTitle,
  yourMeta,
  yourUrl = '',
  targetKeyword,
  onToast,
}: CompetitorComparisonCardProps) {
  // Input states
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Manual fallback mode
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualMeta, setManualMeta] = useState('');
  const [manualContent, setManualContent] = useState('');

  // Loaded competitor data
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);

  // UI view tabs
  const [activeTab, setActiveTab] = useState<'all' | 'content' | 'readability' | 'keywords' | 'headings'>('all');
  const [isCopied, setIsCopied] = useState(false);
  const [isOutlinesOpen, setIsOutlinesOpen] = useState(false);

  // Compute comparison analysis whenever competitorData or your data changes
  const comparison = useMemo(() => {
    if (!competitorData) return null;
    return buildCompetitorComparison({
      yourMetrics,
      yourTitle,
      yourMeta,
      yourUrl,
      competitor: competitorData,
      targetKeyword,
    });
  }, [competitorData, yourMetrics, yourTitle, yourMeta, yourUrl, targetKeyword]);

  // Load sample competitor instantly
  const handleLoadSample = () => {
    setFetchError(null);
    setCompetitorUrl(SAMPLE_COMPETITOR_PAGE.url);
    const metrics = calculateBrowserMetrics(
      SAMPLE_COMPETITOR_PAGE.content,
      targetKeyword || SAMPLE_COMPETITOR_PAGE.targetKeyword,
      SAMPLE_COMPETITOR_PAGE.title
    );
    setCompetitorData({
      url: SAMPLE_COMPETITOR_PAGE.url,
      title: SAMPLE_COMPETITOR_PAGE.title,
      metaDescription: SAMPLE_COMPETITOR_PAGE.metaDescription,
      content: SAMPLE_COMPETITOR_PAGE.content,
      metrics,
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    if (onToast) {
      onToast('Sample competitor (Al Meezan Dental) loaded for comparison.');
    }
  };

  // Fetch real competitor URL via backend /api/fetch-url
  const handleFetchCompetitor = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = competitorUrl.trim();
    if (!url) {
      setFetchError('Please enter a competitor URL.');
      return;
    }

    // Basic URL validation
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setFetchError('URL must begin with http:// or https://');
        return;
      }
    } catch {
      setFetchError('Please enter a valid URL (e.g., https://competitor.com/page)');
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch competitor content.');
      }

      const data = await res.json();
      const compContent = data.content || '';
      const compTitle = data.title || '';
      const compMeta = data.metaDescription || '';

      const compMetrics = calculateBrowserMetrics(compContent, targetKeyword, compTitle);

      setCompetitorData({
        url,
        title: compTitle,
        metaDescription: compMeta,
        content: compContent,
        metrics: compMetrics,
        fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      if (onToast) {
        onToast('Competitor page fetched and analyzed successfully.');
      }
    } catch (err: any) {
      clearTimeout(timer);
      console.error('Competitor fetch error:', err);
      if (err.name === 'AbortError') {
        setFetchError('Fetch request timed out after 60 seconds.');
      } else {
        setFetchError(err.message || 'Unable to fetch competitor URL. Try pasting the content manually.');
      }
    } finally {
      setIsFetching(false);
    }
  };

  // Submit manual competitor content
  const handleApplyManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim()) {
      setFetchError('Please provide competitor text content.');
      return;
    }

    const compMetrics = calculateBrowserMetrics(manualContent, targetKeyword, manualTitle);

    setCompetitorData({
      url: competitorUrl.trim() || 'https://competitor.manual-entry.local',
      title: manualTitle.trim(),
      metaDescription: manualMeta.trim(),
      content: manualContent,
      metrics: compMetrics,
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setShowManualInput(false);
    setFetchError(null);
    if (onToast) {
      onToast('Manual competitor content analyzed.');
    }
  };

  // Clear competitor
  const handleClear = () => {
    setCompetitorData(null);
    setCompetitorUrl('');
    setFetchError(null);
    setShowManualInput(false);
  };

  // Copy Markdown summary
  const handleCopySummary = async () => {
    if (!comparison) return;
    const report = generateCompetitorMarkdownReport(comparison, targetKeyword, yourTitle, yourUrl);
    try {
      await navigator.clipboard.writeText(report);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      if (onToast) onToast('Competitor comparison report copied to clipboard.');
    } catch {
      // Fallback
    }
  };

  // Filtered metric diffs
  const filteredMetrics = useMemo(() => {
    if (!comparison) return [];
    if (activeTab === 'all') return comparison.metricsComparison;
    return comparison.metricsComparison.filter(m => m.category === activeTab);
  }, [comparison, activeTab]);

  return (
    <section
      id="competitor-comparison"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-20"
    >
      {/* Card Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                <Swords className="w-3.5 h-3.5 text-amber-600" />
                Head-to-Head Benchmarking
              </span>
              {competitorData && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                  Analyzed at {competitorData.fetchedAt}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Competitor Comparison
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Contrast your on-page heuristics, content depth, keyword distribution, and heading outline against any ranking competitor to uncover strategic opportunities.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {competitorData && (
              <>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  title="Copy comparison summary to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Comparison</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                  title="Clear competitor analysis"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Competitor Input Bar */}
        <form onSubmit={handleFetchCompetitor} className="mt-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                value={competitorUrl}
                onChange={e => {
                  setCompetitorUrl(e.target.value);
                  if (fetchError) setFetchError(null);
                }}
                placeholder="Enter competitor URL (e.g. https://competitor.com/dentist-in-doha)"
                disabled={isFetching}
                className="w-full pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isFetching || !competitorUrl.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                {isFetching ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Swords className="w-3.5 h-3.5 text-amber-300" />
                    <span>Compare URL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                title="Toggle manual text paste"
              >
                {showManualInput ? 'Hide Manual' : 'Paste Text'}
              </button>
            </div>
          </div>

          {/* Fetch error feedback */}
          {fetchError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{fetchError}</p>
                <p className="text-[11px] text-rose-600/90 mt-0.5">
                  Tip: If the website blocks automated crawlers, click <strong>Paste Text</strong> above to paste the competitor's heading and body copy directly.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Manual Input Expandable Form */}
        {showManualInput && (
          <form onSubmit={handleApplyManual} className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <h4 className="font-semibold text-slate-900 mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Manual Competitor Content Entry
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Competitor Page Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  placeholder="e.g. Best Dentist in Doha | West Bay Dental"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Competitor Meta Description</label>
                <input
                  type="text"
                  value={manualMeta}
                  onChange={e => setManualMeta(e.target.value)}
                  placeholder="e.g. Looking for a trusted dentist in Doha? Schedule an appointment today..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-slate-600 font-medium mb-1">Competitor Page Text (Markdown headings # / ## supported)</label>
              <textarea
                value={manualContent}
                onChange={e => setManualContent(e.target.value)}
                rows={5}
                placeholder="Paste the competitor's main text and headings here..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowManualInput(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Apply Competitor Data
              </button>
            </div>
          </form>
        )}
      </div>

      {/* BODY CONTENT */}
      {!competitorData ? (
        /* Empty State */
        <div className="p-8 text-center bg-slate-50/50">
          <div className="w-14 h-14 rounded-2xl bg-amber-100/70 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-700 mb-3.5 shadow-xs">
            <Swords className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Benchmark Against Your Top Competitor
          </h3>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1 leading-relaxed">
            Enter a competitor URL above to see how your word count, reading level, keyword density, and heading architecture measure up side-by-side.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6 text-left">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs mb-1">
                <BookOpen className="w-4 h-4" />
                <span>Content Depth Gap</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Identify if your page is too thin compared to ranking URLs on Google.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-600 font-semibold text-xs mb-1">
                <Hash className="w-4 h-4" />
                <span>Keyword Placement</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Compare keyword frequency in titles, intro copy, and heading sections.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs mb-1">
                <Layers className="w-4 h-4" />
                <span>Outline Hierarchy</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Discover structural topics, H2 categories, and questions your page omitted.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="p-6 space-y-6">
          {/* Executive Scoreboard Banner */}
          {comparison && (
            <div className="p-5 rounded-xl bg-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <span>Target Keyword:</span>
                  <span className="font-mono font-semibold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded">
                    {targetKeyword || '(Not specified)'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Head-to-Head Scoreboard</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                  {comparison.summary.verdict}
                </p>
              </div>

              {/* Wins breakdown pill */}
              <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-slate-700/80 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs">
                  <Trophy className="w-3.5 h-3.5" />
                  <span className="font-bold">{comparison.summary.yourWins}</span>
                  <span className="text-[11px] text-slate-300">You</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-bold">{comparison.summary.competitorWins}</span>
                  <span className="text-[11px] text-slate-300">Competitor</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-300 text-xs">
                  <Equal className="w-3.5 h-3.5" />
                  <span className="font-bold">{comparison.summary.ties}</span>
                  <span className="text-[11px] text-slate-400">Ties</span>
                </div>
              </div>
            </div>
          )}

          {/* Competitor Page Metadata Strip */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">
                  {competitorData.title || competitorData.url}
                </span>
                {competitorData.url.startsWith('http') && (
                  <a
                    href={competitorData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                    title="Open competitor URL in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-slate-500 font-mono text-[11px] truncate mt-0.5">
                {competitorData.url}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-slate-600 font-medium">
              <span>{competitorData.metrics.wordCount} words</span>
              <span>•</span>
              <span>Flesch {competitorData.metrics.fleschScore}</span>
              <span>•</span>
              <span>{competitorData.metrics.h1Count} H1</span>
            </div>
          </div>

          {/* Metric Category Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              {(
                [
                  { id: 'all', label: 'All Metrics' },
                  { id: 'content', label: 'Content Depth' },
                  { id: 'readability', label: 'Readability' },
                  { id: 'keywords', label: 'Keywords' },
                  { id: 'headings', label: 'Headings' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 hidden sm:block">
              Showing {filteredMetrics.length} metrics
            </div>
          </div>

          {/* Head-to-Head Comparison Table / Cards */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-200">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <div className="col-span-12 sm:col-span-4">Metric</div>
              <div className="col-span-6 sm:col-span-3 text-left">Your Page</div>
              <div className="col-span-6 sm:col-span-3 text-left">Competitor</div>
              <div className="hidden sm:block sm:col-span-2 text-right">Advantage</div>
            </div>

            {/* Metric Rows */}
            {filteredMetrics.map((item, idx) => {
              const isYourWin = item.winner === 'you';
              const isCompWin = item.winner === 'competitor';
              const isTie = item.winner === 'tie';

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 px-4 py-3.5 hover:bg-slate-50/70 transition-colors items-center gap-y-2 text-xs"
                >
                  {/* Metric Name & Category */}
                  <div className="col-span-12 sm:col-span-4 pr-2">
                    <div className="font-semibold text-slate-900">{item.metric}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                      {item.insight}
                    </div>
                  </div>

                  {/* Your Page Value */}
                  <div className="col-span-6 sm:col-span-3">
                    <div className="sm:hidden text-[10px] uppercase font-bold text-slate-400">
                      Your Page
                    </div>
                    <div
                      className={`font-mono text-xs inline-flex items-center gap-1.5 ${
                        isYourWin ? 'font-bold text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {item.yourValue}
                      {isYourWin && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                    </div>
                  </div>

                  {/* Competitor Value */}
                  <div className="col-span-6 sm:col-span-3">
                    <div className="sm:hidden text-[10px] uppercase font-bold text-slate-400">
                      Competitor
                    </div>
                    <div
                      className={`font-mono text-xs inline-flex items-center gap-1.5 ${
                        isCompWin ? 'font-bold text-amber-700' : 'text-slate-700'
                      }`}
                    >
                      {item.competitorValue}
                      {isCompWin && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                    </div>
                  </div>

                  {/* Advantage Badge */}
                  <div className="col-span-12 sm:col-span-2 sm:text-right flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
                    <span className="text-[11px] text-slate-400 sm:hidden">
                      Comparison:
                    </span>
                    {isYourWin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Trophy className="w-3 h-3 text-emerald-600" />
                        <span>You lead</span>
                      </span>
                    ) : isCompWin ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Zap className="w-3 h-3 text-amber-600" />
                        <span>Competitor</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <Equal className="w-3 h-3" />
                        <span>Tied</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-Side Snippets (Title & Meta) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Title Tag Comparison */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Title Tag Comparison
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Your Title Tag:</span>
                    <span className="font-mono">{(yourTitle || '').length} chars</span>
                  </div>
                  <p className="font-medium text-slate-900 break-words">
                    {yourTitle || <span className="text-rose-500 italic">Missing or empty title</span>}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/70">
                  <div className="flex items-center justify-between text-[11px] text-amber-800 mb-1">
                    <span className="font-semibold">Competitor Title Tag:</span>
                    <span className="font-mono">{competitorData.title.length} chars</span>
                  </div>
                  <p className="font-medium text-slate-900 break-words">
                    {competitorData.title || <span className="text-slate-400 italic">None</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Meta Description Comparison */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Meta Description Comparison
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">Your Meta Description:</span>
                    <span className="font-mono">{(yourMeta || '').length} chars</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed break-words">
                    {yourMeta || <span className="text-rose-500 italic">Missing meta description tag</span>}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/70">
                  <div className="flex items-center justify-between text-[11px] text-amber-800 mb-1">
                    <span className="font-semibold">Competitor Meta Description:</span>
                    <span className="font-mono">{competitorData.metaDescription.length} chars</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed break-words">
                    {competitorData.metaDescription || (
                      <span className="text-slate-400 italic">No meta description found</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Heading Outlines Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setIsOutlinesOpen(!isOutlinesOpen)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between transition-colors text-xs font-semibold text-slate-900"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Side-by-Side Heading Outline Comparison</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  ({yourMetrics.headingsList.length} headings vs {competitorData.metrics.headingsList.length} headings)
                </span>
              </div>
              {isOutlinesOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {isOutlinesOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 text-xs">
                {/* Your Headings */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Your Headings ({yourMetrics.headingsList.length})</span>
                    {!yourMetrics.headingsLogicalOrder && (
                      <span className="text-[11px] text-amber-700 font-medium">Hierarchy Issues</span>
                    )}
                  </div>
                  {yourMetrics.headingsList.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No headings found in content.</p>
                  ) : (
                    <ul className="space-y-1.5 font-mono text-[11px]">
                      {yourMetrics.headingsList.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-700">
                          <span className="font-bold text-indigo-600 shrink-0">H{h.level}</span>
                          <span className="truncate">{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Competitor Headings */}
                <div className="p-3 rounded-lg bg-amber-50/40 border border-amber-200/80">
                  <div className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Competitor Headings ({competitorData.metrics.headingsList.length})</span>
                    <span className="text-[11px] text-emerald-700 font-medium">Logical Structure</span>
                  </div>
                  {competitorData.metrics.headingsList.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No competitor headings detected.</p>
                  ) : (
                    <ul className="space-y-1.5 font-mono text-[11px]">
                      {competitorData.metrics.headingsList.map((h, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-slate-700">
                          <span className="font-bold text-amber-600 shrink-0">H{h.level}</span>
                          <span className="truncate">{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Strategic Action Items to Outrank This Competitor */}
          {comparison && comparison.actionableInsights.length > 0 && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 border border-indigo-100 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="p-1 rounded-md bg-indigo-600 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Priority Action Items to Outrank This Competitor
                </h4>
              </div>

              <div className="space-y-2.5">
                {comparison.actionableInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-indigo-100/80 flex items-start gap-2.5 shadow-2xs text-xs text-slate-700"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
