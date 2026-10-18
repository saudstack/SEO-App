/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HeadingItem {
  level: number;
  text: string;
}

export interface HeadingAnalysis {
  h1Count: number;
  isH1Valid: boolean;
  isLogicalOrder: boolean;
  issues: string[];
  headings: HeadingItem[];
}

export interface BrowserMetrics {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  fleschScore: number;
  fleschLabel: 'Easy to read' | 'Standard' | 'Difficult';
  keywordCount: number;
  keywordDensity: number;
  inTitle: boolean;
  inFirst100: boolean;
  inHeadings: boolean;
  h1Count: number;
  headingsLogicalOrder: boolean;
  headingIssues: string[];
  headingsList: HeadingItem[];
  thinContentWarning: boolean;
}

export interface KeywordGap {
  termOrQuestion: string;
  type: 'term' | 'question';
  reason: string;
}

export interface ReadabilityNote {
  original: string;
  rewrite: string;
  reason: string;
}

export interface FixItem {
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  reason: string;
}

export interface ScoreBreakdown {
  content_depth: number;
  readability: number;
  keyword_optimization: number;
  heading_structure: number;
}

export interface OutlineItem {
  level: 'H2' | 'H3';
  heading: string;
  purpose: string;
}

export interface HeadingRecommendations {
  h1_suggestion: string;
  recommended_outline: OutlineItem[];
}

export interface SerpPreviewData {
  title: string;
  meta_description: string;
}

export interface AuditResult {
  overall_score: number;
  verdict: string;
  score_breakdown: ScoreBreakdown;
  title_suggestions: string[];
  meta_description_suggestions: string[];
  url_slug_suggestion: string;
  heading_recommendations: HeadingRecommendations;
  keyword_gaps: KeywordGap[];
  readability_notes: ReadabilityNote[];
  fix_list: FixItem[];
}

/**
 * Shared request payload for POST /api/audit.
 * Validated by server.ts against the following constraints:
 * - pageContent: Required non-empty string, capped at 50,000 characters.
 * - targetKeyword: Required non-empty string, capped at 200 characters.
 * - secondaryKeywords: Array of strings, capped at maximum 10 items.
 * - title: Optional string, capped at 300 characters.
 * - metaDescription: Optional string, capped at 500 characters.
 * - pageUrl: Optional valid URL string, capped at 2048 characters.
 * - metrics: Pre-calculated BrowserMetrics object.
 */
export interface AuditRequestPayload {
  /** Page content including body and headings (maximum 50,000 characters). */
  pageContent: string;
  /** Primary target keyword for on-page benchmarking (maximum 200 characters). */
  targetKeyword: string;
  /** Optional secondary keywords to check (maximum 10 keywords). */
  secondaryKeywords?: string[];
  /** Optional existing page title tag (maximum 300 characters). */
  title?: string;
  /** Optional existing meta description tag (maximum 500 characters). */
  metaDescription?: string;
  /** Optional page URL (maximum 2048 characters). */
  pageUrl?: string;
  /** Client-side pre-calculated heuristics and diagnostic metrics. */
  metrics?: BrowserMetrics;
}
