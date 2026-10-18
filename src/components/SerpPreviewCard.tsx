/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Monitor, Smartphone, Copy, Check, Globe, Code2 } from 'lucide-react';

interface SerpPreviewCardProps {
  pageUrl?: string;
  targetKeyword: string;
  selectedTitle: string;
  selectedMeta: string;
  suggestedSlug: string;
  titleSuggestions: string[];
  metaSuggestions: string[];
  onSelectTitle: (title: string) => void;
  onSelectMeta: (meta: string) => void;
}

export const SerpPreviewCard: React.FC<SerpPreviewCardProps> = ({
  pageUrl,
  targetKeyword,
  selectedTitle,
  selectedMeta,
  suggestedSlug,
  titleSuggestions,
  metaSuggestions,
  onSelectTitle,
  onSelectMeta,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  // Compute clean display URL
  const domain = pageUrl
    ? pageUrl.replace(/^https?:\/\//, '').split('/')[0]
    : 'example.com';
  const cleanSlug = suggestedSlug.startsWith('/') ? suggestedSlug.slice(1) : suggestedSlug;
  const breadcrumbUrl = `https://${domain} › ${cleanSlug || 'page'}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAction(id);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  const htmlMetaCode = `<title>${selectedTitle}</title>\n<meta name="description" content="${selectedMeta}" />`;

  // Highlight target keyword in snippet
  const renderHighlightedSnippet = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const parts = text.split(new RegExp(`(${keyword})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <strong key={i} className="font-semibold text-slate-900">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  return (
    <div id="serp-preview" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Google SERP Snippet Preview</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-world simulation of your title, URL slug, and meta description on search result pages
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop/Mobile Segmented Control */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'desktop'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                viewMode === 'mobile'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleCopy(htmlMetaCode, 'html')}
            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors flex items-center gap-1.5 ${
              copiedAction === 'html'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Copy HTML meta tags for <head>"
          >
            {copiedAction === 'html' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied HTML</span>
              </>
            ) : (
              <>
                <Code2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Copy HTML Tags</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Realistic Google Search Card Container */}
      <div
        className={`p-4 sm:p-5 rounded-lg border border-slate-200/90 bg-slate-50/40 transition-all ${
          viewMode === 'mobile' ? 'max-w-md mx-auto bg-white shadow-xs' : 'max-w-2xl'
        }`}
      >
        {/* Favicon & Breadcrumb */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
            <Globe className="w-2.5 h-2.5 text-slate-600" />
          </div>
          <span className="text-xs text-slate-600 truncate font-mono">{breadcrumbUrl}</span>
        </div>

        {/* Title Tag */}
        <h4 className="text-lg text-indigo-700 hover:underline font-normal cursor-pointer leading-snug tracking-tight line-clamp-2">
          {selectedTitle || 'Untitled Page'}
        </h4>

        {/* Meta Description Snippet */}
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
          {renderHighlightedSnippet(selectedMeta || 'No meta description provided.', targetKeyword)}
        </p>
      </div>

      {/* Suggested Slug & Quick Switcher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
        {/* Slug Helper */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-700 block mb-0.5">Recommended URL Slug</span>
            <span className="font-mono text-slate-600 font-medium">{suggestedSlug || '/target-keyword'}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(suggestedSlug, 'slug')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 ${
              copiedAction === 'slug'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {copiedAction === 'slug' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedAction === 'slug' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Live Preview Switcher Hints */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col justify-center">
          <span className="font-semibold text-slate-700 mb-0.5">Interactive SERP Preview</span>
          <span className="text-slate-500 text-[11px]">
            Click any suggestion below to test how different title and meta options look on Google.
          </span>
        </div>
      </div>
    </div>
  );
};
