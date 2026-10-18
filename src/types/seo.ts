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

export interface AuditResult {
  overall_score: number;
  verdict: string;
  title_suggestions: string[];
  meta_description_suggestions: string[];
  keyword_gaps: KeywordGap[];
  readability_notes: ReadabilityNote[];
  fix_list: FixItem[];
}

export interface AuditRequestPayload {
  pageContent: string;
  title: string;
  metaDescription: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  pageUrl?: string;
  metrics: BrowserMetrics;
}
