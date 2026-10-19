/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ReadabilityNote, BrowserMetrics } from '../types/seo';
import { calculateDetailedReadabilityMetrics } from '../utils/seoCalculations';
import {
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  BarChart2,
  BookOpen,
  AlertTriangle,
  Layers,
  HelpCircle,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface ReadabilityCardProps {
  notes: ReadabilityNote[];
  content?: string;
  metrics?: BrowserMetrics;
}

export const ReadabilityCard: React.FC<ReadabilityCardProps> = ({
  notes = [],
  content = '',
  metrics,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'complexity' | 'syllables' | 'flagged'>('complexity');
  const [copiedSentenceIndex, setCopiedSentenceIndex] = useState<number | null>(null);

  // Compute detailed readability metrics from the analyzed content
  const detailed = useMemo(() => {
    // If content is provided, calculate from content
    if (content && content.trim().length > 0) {
      return calculateDetailedReadabilityMetrics(content);
    }
    // Fallback if content was not passed directly: synthesize from notes
    const sampleText = notes.map(n => n.original + ' ' + n.rewrite).join('. ');
    return calculateDetailedReadabilityMetrics(sampleText || 'Page content analysis.');
  }, [content, notes]);

  const handleCopyRewrite = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopySentence = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSentenceIndex(index);
    setTimeout(() => setCopiedSentenceIndex(null), 2000);
  };

  const fleschBadgeColor = useMemo(() => {
    const score = metrics?.fleschScore ?? detailed.fleschScore;
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 55) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }, [metrics, detailed]);

  return (
    <div id="readability" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Readability &amp; Sentence Analytics
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${fleschBadgeColor}`}>
                Score: {metrics?.fleschScore ?? detailed.fleschScore}/100 &bull; {metrics?.fleschLabel ?? detailed.fleschLabel}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Sentence cadence, syllable density, and automated plain-English rewrites
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <span className="text-xs font-mono text-slate-500 tabular-nums bg-slate-50 px-2 py-1 rounded border border-slate-200">
            {detailed.totalSentences} sentences &bull; {detailed.totalWords} words
          </span>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Avg Sentence Length
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {detailed.avgSentenceLength}
            </span>
            <span className="text-xs text-slate-500">words</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Target: 14–18 words/sent
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Complex Words (3+ Syll)
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {detailed.complexWordPercentage}%
            </span>
            <span className="text-xs text-slate-500">({detailed.complexWordCount})</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {detailed.complexWordPercentage > 15 ? 'High (Target: < 15%)' : 'Optimal scannability'}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Sentences &gt; 30 Words
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-xl font-bold font-mono ${
                detailed.flaggedLongSentences.length > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {detailed.flaggedLongSentences.length}
            </span>
            <span className="text-xs text-slate-500">flagged</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {detailed.flaggedLongSentences.length > 0 ? 'Review & split' : 'No cognitive bottlenecks'}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Avg Syllables / Word
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-slate-900 font-mono">
              {detailed.avgSyllablesPerWord}
            </span>
            <span className="text-xs text-slate-500">syll/word</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Avg Length: {detailed.avgWordLength} chars
          </div>
        </div>
      </div>

      {/* Visual Chart Card */}
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50/30 p-4">
        {/* Chart View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('complexity')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'complexity'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Sentence Complexity</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('syllables')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'syllables'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Word &amp; Syllables</span>
            </button>
            {detailed.flaggedLongSentences.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('flagged')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'flagged'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Dense Sentences ({detailed.flaggedLongSentences.length})</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Calculated from live page content</span>
          </div>
        </div>

        {/* Tab 1: Sentence Complexity Chart */}
        {activeTab === 'complexity' && (
          <div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={detailed.sentenceComplexity}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-lg border border-slate-800 max-w-xs">
                            <div className="font-bold flex items-center gap-1.5 mb-1">
                              <span
                                className="w-2.5 h-2.5 rounded-full inline-block"
                                style={{ backgroundColor: data.color }}
                              />
                              <span>
                                {data.category} ({data.range})
                              </span>
                            </div>
                            <div className="text-slate-200">
                              <span className="font-mono font-semibold">{data.count}</span> sentences ({data.percentage}%)
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {data.benchmark} &bull; {data.description}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    name="Sentence Distribution"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {detailed.sentenceComplexity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Complexity Legend & Benchmarks */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200/70">
              {detailed.sentenceComplexity.map((item, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.category}</span>
                    <span className="text-[11px] text-slate-500 font-mono">({item.range})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    <span className="font-bold font-mono text-slate-900">{item.count}</span> ({item.percentage}%)
                    <span className="text-slate-400 ml-1">&bull; {item.benchmark}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Word & Syllable Distribution */}
        {activeTab === 'syllables' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Syllable Chart */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Syllable Density (Word Complexity)
                </div>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={detailed.syllableDistribution}
                      margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="syllables"
                        tick={{ fill: '#475569', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        unit="%"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white rounded-lg p-2.5 text-xs shadow-lg border border-slate-800 max-w-xs">
                                <div className="font-bold mb-1">
                                  {data.syllables} &bull; {data.label}
                                </div>
                                <div className="text-slate-200">
                                  <span className="font-mono font-semibold">{data.count}</span> words ({data.percentage}%)
                                </div>
                                {data.exampleWords?.length > 0 && (
                                  <div className="text-[11px] text-slate-400 mt-1">
                                    Examples: {data.exampleWords.join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="percentage"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={44}
                      >
                        {detailed.syllableDistribution.map((entry, index) => (
                          <Cell key={`cell-syll-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Word Length Breakdown */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Character Length Distribution
                </div>
                <div className="space-y-3 pt-1">
                  {detailed.wordLengthDistribution.map((bucket, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-white border border-slate-200">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{bucket.lengthBucket}</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {bucket.count} words ({bucket.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, bucket.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Higher proportions of 1-syllable and short words correlate with higher mobile readability and faster comprehension.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Flagged Dense Sentences */}
        {activeTab === 'flagged' && (
          <div className="space-y-2.5">
            <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                These sentences exceed 30 words and have high cognitive load. Breaking them into two shorter sentences will raise your Flesch Reading Ease score.
              </span>
            </div>

            {detailed.flaggedLongSentences.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px] font-semibold">
                      {item.words} words
                    </span>
                    <span className="text-[11px] text-slate-400">Dense Sentence #{idx + 1}</span>
                  </div>
                  <p className="text-slate-800 italic leading-relaxed">
                    &ldquo;{item.text}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopySentence(item.text, idx)}
                  className="self-end sm:self-center px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors flex items-center gap-1"
                >
                  {copiedSentenceIndex === idx ? (
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
            ))}
          </div>
        )}
      </div>

      {/* Plain-English Rewrites & Notes Section */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              AI-Generated Plain-English Rewrites
            </h4>
          </div>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {notes.length} Targeted Rewrites
          </span>
        </div>

        {notes.length === 0 ? (
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>No convoluted sentences identified. The page copy is clean, crisp, and direct.</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
