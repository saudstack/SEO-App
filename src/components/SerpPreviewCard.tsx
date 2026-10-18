/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Copy,
  Check,
  Globe,
  Code2,
  Search,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';

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
  const [animKey, setAnimKey] = useState(0);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  const handleSwitchMode = (mode: 'desktop' | 'mobile') => {
    if (mode !== viewMode) {
      setViewMode(mode);
      setAnimKey(prev => prev + 1);
    }
  };

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
    <div id="serp-preview" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      {/* Top Header & Device Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Google SERP Snippet Preview
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              {viewMode === 'desktop' ? '1024px Desktop' : '375px Mobile'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare visual representation across desktop (1024px) and mobile (375px) search displays
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Visual Display Switcher: Desktop (1024px) vs Mobile (375px) */}
          <div
            role="group"
            aria-label="Display Viewport Switcher"
            className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium"
          >
            <button
              type="button"
              onClick={() => handleSwitchMode('desktop')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                viewMode === 'desktop'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/80 scale-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Switch to Desktop display (1024px width)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop (1024px)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchMode('mobile')}
              className={`px-3 py-1.5 rounded-md transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                viewMode === 'mobile'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/80 scale-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title="Switch to Mobile display (375px width)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile (375px)</span>
            </button>
          </div>

          {/* Copy HTML Meta Tag button */}
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

      {/* Viewport Simulation Frame Area */}
      <div className="bg-slate-100/80 border border-slate-200/90 rounded-xl p-4 sm:p-6 overflow-x-auto flex justify-center items-start min-h-[380px] transition-all duration-500 ease-out">
        {/* DESKTOP DISPLAY (1024px width) */}
        {viewMode === 'desktop' && (
          <div
            key={`desktop-${animKey}`}
            className="animate-serp-switch w-[1024px] max-w-full bg-white rounded-lg shadow-md hover:shadow-xl border border-slate-200 overflow-hidden transition-all duration-300 ease-out transform hover:scale-[1.002]"
          >
            {/* Desktop Browser Top Bar (Chrome / Safari styling) */}
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="ml-2 font-mono text-[11px] text-slate-400">Desktop Viewport — 1024px</span>
              </div>

              {/* Simulated Browser URL bar */}
              <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-slate-200 max-w-md w-full justify-between text-[11px]">
                <span className="truncate text-slate-600 font-mono">
                  https://www.google.com/search?q={encodeURIComponent(targetKeyword || 'seo')}
                </span>
                <Search className="w-3 h-3 text-slate-400 shrink-0" />
              </div>

              <span className="font-semibold text-slate-600">1024 &times; 768</span>
            </div>

            {/* Google Search Desktop Interior */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Google Desktop Header & Tabs */}
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-2 -mb-3">
                    All
                  </span>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">Images</span>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">Maps</span>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">News</span>
                  <span className="text-slate-500 hover:text-slate-700 cursor-pointer">Videos</span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  About 245,000 results (0.34 seconds)
                </span>
              </div>

              {/* Result Snippet: Desktop standard 600px max width */}
              <div className="max-w-[600px] space-y-1.5 pt-1">
                {/* Desktop Favicon & Breadcrumb */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <Globe className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-800 font-medium leading-none">
                      {domain}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono leading-tight mt-0.5">
                      {breadcrumbUrl}
                    </span>
                  </div>
                </div>

                {/* Title (20px standard Google Blue) */}
                <h4 className="text-[20px] text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug line-clamp-1 pt-0.5">
                  {selectedTitle || 'Untitled Page'}
                </h4>

                {/* Meta Description Snippet */}
                <p className="text-[14px] text-[#4d5156] leading-[1.58] line-clamp-2">
                  {renderHighlightedSnippet(selectedMeta || 'No meta description provided.', targetKeyword)}
                </p>

                {/* Sitelinks Mockup for Realistic Depth */}
                <div className="pt-2 flex items-center gap-4 text-xs text-[#1a0dab]">
                  <span className="hover:underline cursor-pointer">Services</span>
                  <span>·</span>
                  <span className="hover:underline cursor-pointer">About Us</span>
                  <span>·</span>
                  <span className="hover:underline cursor-pointer">Contact</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MOBILE DISPLAY (375px width) */}
        {viewMode === 'mobile' && (
          <div
            key={`mobile-${animKey}`}
            className="animate-serp-switch w-[375px] max-w-full bg-white rounded-[32px] shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-slate-800 overflow-hidden transition-all duration-300 ease-out transform hover:scale-[1.01]"
          >
            {/* Mobile Status Bar & Speaker Notch */}
            <div className="bg-slate-900 px-6 pt-3 pb-2 flex items-center justify-between text-[11px] text-white">
              <span className="font-semibold">9:41</span>
              {/* Notch */}
              <div className="w-20 h-4 bg-slate-950 rounded-full mx-auto" />
              <div className="flex items-center gap-1.5">
                <span className="text-[9px]">5G</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-white inline-block" />
              </div>
            </div>

            {/* Mobile Google Search Bar Header */}
            <div className="bg-white px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full w-full text-xs text-slate-700">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate flex-1 font-medium text-slate-800">
                  {targetKeyword || 'search query'}
                </span>
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                  G
                </span>
              </div>
            </div>

            {/* Mobile SERP Content Area (375px width display) */}
            <div className="p-4 space-y-3 bg-slate-50/60 min-h-[320px]">
              {/* Mobile Dimension Badge */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span className="font-mono">Mobile Viewport: 375px</span>
                <span>Google Search Mobile</span>
              </div>

              {/* Mobile SERP Result Card */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-xs space-y-2">
                {/* Mobile Result Top: Favicon, Site & Context Menu */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Globe className="w-3 h-3 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-slate-900 block truncate">
                        {domain}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block truncate">
                        {breadcrumbUrl}
                      </span>
                    </div>
                  </div>
                  <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>

                {/* Mobile Title */}
                <h4 className="text-[16px] font-medium text-[#1a0dab] leading-snug line-clamp-2">
                  {selectedTitle || 'Untitled Page'}
                </h4>

                {/* Mobile Meta Description */}
                <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-3">
                  {renderHighlightedSnippet(selectedMeta || 'No meta description provided.', targetKeyword)}
                </p>
              </div>

              {/* Secondary simulated organic result for realism */}
              <div className="bg-white/80 rounded-xl p-3 border border-slate-200/60 shadow-2xs space-y-1.5 opacity-60">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200" />
                  <span className="text-xs text-slate-600">competitor-directory.com</span>
                </div>
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            </div>

            {/* Mobile Bottom Home Bar */}
            <div className="bg-white py-2 flex justify-center">
              <div className="w-28 h-1 bg-slate-300 rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Suggested Slug & Quick Interactive Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
        {/* Recommended Slug */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="font-semibold text-slate-700 block mb-0.5">Recommended URL Slug</span>
            <span className="font-mono text-slate-600 font-medium truncate block">
              {suggestedSlug || '/target-keyword'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(suggestedSlug, 'slug')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 shrink-0 ${
              copiedAction === 'slug'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {copiedAction === 'slug' ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>{copiedAction === 'slug' ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Quick Selection Switcher Pills */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
          <span className="font-semibold text-slate-700 block">Switch Title in SERP Preview</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {titleSuggestions.map((t, idx) => {
              const isSelected = selectedTitle === t;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectTitle(t)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  Option {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
