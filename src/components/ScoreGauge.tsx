/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserMetrics, ScoreBreakdown } from '../types/seo';
import { CheckCircle2, AlertTriangle, XCircle, FileText, BookOpen, KeyRound, Layers } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  verdict: string;
  metrics: BrowserMetrics;
  scoreBreakdown?: ScoreBreakdown;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, verdict, metrics, scoreBreakdown }) => {
  // Color calculation based on standard SEO score bands
  const getScoreColor = (val: number) => {
    if (val >= 80) return { stroke: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', label: 'Good' };
    if (val >= 55) return { stroke: '#f59e0b', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', label: 'Needs Improvement' };
    return { stroke: '#ef4444', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500', label: 'Poor' };
  };

  const color = getScoreColor(score);

  // SVG Gauge calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const subScores = scoreBreakdown
    ? [
        { label: 'Content Depth', score: scoreBreakdown.content_depth, desc: 'Coverage and thoroughness' },
        { label: 'Readability', score: scoreBreakdown.readability, desc: 'Sentence cadence and tone' },
        { label: 'Keyword Optimization', score: scoreBreakdown.keyword_optimization, desc: 'Frequency, density, and intent' },
        { label: 'Heading Structure', score: scoreBreakdown.heading_structure, desc: 'H1 clarity and logical flow' },
      ]
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left / Center: Score Circular Gauge */}
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="none"
              />
              {/* Progress track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={color.stroke}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
                {score}
              </span>
              <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                out of 100
              </span>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <span className={color.text}>{color.label} Condition</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="text-slate-500">Heuristic & AI Weighted</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              SEO Audit Verdict
            </h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {verdict}
            </p>
          </div>
        </div>

        {/* Right: Quick Heuristics Matrix */}
        <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
          {/* Word Count */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Content Length</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {metrics.wordCount} <span className="text-xs font-normal text-slate-500">words</span>
              </span>
              {metrics.thinContentWarning ? (
                <span className="text-xs text-rose-600 font-medium flex items-center gap-0.5">
                  <AlertTriangle className="w-3 h-3" /> Thin
                </span>
              ) : (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> OK
                </span>
              )}
            </div>
          </div>

          {/* Readability */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading Ease</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {metrics.fleschScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
              </span>
              <span className={`text-xs font-medium ${metrics.fleschScore >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {metrics.fleschLabel}
              </span>
            </div>
          </div>

          {/* Keyword Density */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Keyword Density</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {metrics.keywordDensity}%
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {metrics.keywordCount} {metrics.keywordCount === 1 ? 'match' : 'matches'}
              </span>
            </div>
          </div>

          {/* Heading Order */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Heading Hierarchy</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {metrics.h1Count} H1
              </span>
              {metrics.headingsLogicalOrder ? (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                </span>
              ) : (
                <span className="text-xs text-rose-600 font-medium flex items-center gap-0.5">
                  <XCircle className="w-3.5 h-3.5" /> Issues
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Pillar Score Breakdown */}
      {subScores && (
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
            Core SEO Pillars Breakdown
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subScores.map((pillar, idx) => {
              const subColor = getScoreColor(pillar.score);
              return (
                <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">{pillar.label}</span>
                    <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                      {pillar.score} <span className="text-xs font-normal text-slate-400">/ 100</span>
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${subColor.bar} transition-all duration-700 rounded-full`}
                      style={{ width: `${Math.min(100, Math.max(0, pillar.score))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
