/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const HeroIntro: React.FC = () => {
  return (
    <div className="py-6 sm:py-8">
      <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 tracking-wider uppercase mb-2">
        <ShieldCheck className="w-4 h-4 text-indigo-600" />
        <span>Technical On-Page Auditor</span>
        <span className="text-slate-300" aria-hidden="true">·</span>
        <span className="text-slate-500 font-normal">Deterministic Heuristics + AI Strategy</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 max-w-3xl" style={{ textWrap: 'balance' }}>
        Instant, structured SEO audit for your web pages
      </h1>

      <p className="mt-3 text-base text-slate-600 max-w-2xl leading-relaxed">
        Analyze content volume, Flesch reading ease, keyword density, and heading logic in real-time.
        Receive AI-driven title tag rewrites, meta descriptions, semantic keyword gaps, and a prioritized fix list.
      </p>
    </div>
  );
};
