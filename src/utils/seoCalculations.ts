/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserMetrics, HeadingAnalysis, HeadingItem, AuditResult } from '../types/seo';

/**
 * Counts syllables in an English word using standard phonetic heuristics.
 */
export function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  // Replace common endings that don't add syllables
  let processed = cleaned
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  const matches = processed.match(/[aeiouy]{1,2}/g);
  const count = matches ? matches.length : 0;
  return Math.max(1, count);
}

/**
 * Extracts words from text, ignoring pure punctuation.
 */
export function extractWords(text: string): string[] {
  // Strip Markdown markers and HTML tags first
  const clean = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/#+\s*/g, ' ')
    .replace(/[*_`~[\]()]/g, ' ');
  const words = clean.match(/\b[\w'-]+\b/g);
  return words || [];
}

/**
 * Splits text into sentences, handling standard punctuation.
 */
export function extractSentences(text: string): string[] {
  // Normalize newlines and clean markdown headers
  const clean = text.replace(/#+\s*/g, '').trim();
  if (!clean) return [];

  // Match sentences ending in ., !, or ?
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && /\w/.test(s));

  return sentences.length > 0 ? sentences : [clean];
}

/**
 * Computes Flesch Reading Ease score and plain English label.
 * Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
 */
export function calculateFleschReadingEase(
  totalWords: number,
  totalSentences: number,
  totalSyllables: number
): { score: number; label: 'Easy to read' | 'Standard' | 'Difficult' } {
  if (totalWords === 0 || totalSentences === 0) {
    return { score: 0, label: 'Difficult' };
  }

  const wordsPerSentence = totalWords / totalSentences;
  const syllablesPerWord = totalSyllables / totalWords;
  const rawScore = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  let label: 'Easy to read' | 'Standard' | 'Difficult' = 'Standard';
  if (score >= 70) {
    label = 'Easy to read';
  } else if (score < 55) {
    label = 'Difficult';
  } else {
    label = 'Standard';
  }

  return { score, label };
}

/**
 * Analyzes headings in markdown or HTML format.
 */
export function analyzeHeadings(content: string): HeadingAnalysis {
  const headings: HeadingItem[] = [];
  const lines = content.split('\n');

  // Parse Markdown headings (#, ##, etc.)
  for (const line of lines) {
    const trimmed = line.trim();
    const mdMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (mdMatch) {
      headings.push({
        level: mdMatch[1].length,
        text: mdMatch[2].replace(/[*_`]/g, '').trim(),
      });
      continue;
    }

    // Parse HTML headings (<h1>..<h6>)
    const htmlMatch = trimmed.match(/<h([1-6])[^>]*>(.*?)<\/h\1>/i);
    if (htmlMatch) {
      headings.push({
        level: parseInt(htmlMatch[1], 10),
        text: htmlMatch[2].replace(/<[^>]*>/g, '').trim(),
      });
    }
  }

  const h1Count = headings.filter(h => h.level === 1).length;
  const isH1Valid = h1Count === 1;

  const issues: string[] = [];
  if (h1Count === 0) {
    issues.push('Missing H1 heading (search engines look for a single main H1).');
  } else if (h1Count > 1) {
    issues.push(`Found ${h1Count} H1 headings. Best practice is exactly one H1 per page.`);
  }

  let isLogicalOrder = true;
  let previousLevel = 1;

  for (let i = 0; i < headings.length; i++) {
    const current = headings[i];
    if (i === 0 && current.level !== 1) {
      issues.push(`First heading is an H${current.level} instead of an H1.`);
      isLogicalOrder = false;
    } else if (i > 0) {
      // Skipping levels down (e.g. H1 directly to H3 or H2 directly to H4)
      if (current.level > previousLevel + 1) {
        issues.push(`Heading level skipped from H${previousLevel} to H${current.level} ("${current.text}").`);
        isLogicalOrder = false;
      }
    }
    previousLevel = current.level;
  }

  return {
    h1Count,
    isH1Valid,
    isLogicalOrder: isLogicalOrder && isH1Valid,
    issues,
    headings,
  };
}

/**
 * Runs complete browser-side SEO calculations on raw content.
 */
export function calculateBrowserMetrics(
  content: string,
  targetKeyword: string,
  pageTitle?: string
): BrowserMetrics {
  const words = extractWords(content);
  const sentences = extractSentences(content);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const avgSentenceLength = wordCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : 0;

  let totalSyllables = 0;
  for (const w of words) {
    totalSyllables += countSyllables(w);
  }

  const { score: fleschScore, label: fleschLabel } = calculateFleschReadingEase(
    wordCount,
    sentenceCount,
    totalSyllables
  );

  // Target keyword analysis
  const normalizedKeyword = targetKeyword.trim().toLowerCase();
  let keywordCount = 0;
  let inTitle = false;
  let inFirst100 = false;
  let inHeadings = false;

  if (normalizedKeyword) {
    // Escape regex characters
    const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    // Count in full text
    const matches = content.match(regex);
    keywordCount = matches ? matches.length : 0;

    // Check title
    if (pageTitle) {
      inTitle = regex.test(pageTitle);
    } else {
      // Fallback check in first line or top H1
      const firstHeading = content.match(/^#\s+(.+)$/m);
      if (firstHeading) {
        inTitle = regex.test(firstHeading[1]);
      }
    }

    // Check first 100 words
    const first100WordsText = words.slice(0, 100).join(' ');
    inFirst100 = new RegExp(`\\b${escaped}\\b`, 'i').test(first100WordsText);

    // Check in headings
    const headingAnalysis = analyzeHeadings(content);
    inHeadings = headingAnalysis.headings.some(h =>
      new RegExp(`\\b${escaped}\\b`, 'i').test(h.text)
    );
  }

  const keywordWordCount = normalizedKeyword ? normalizedKeyword.split(/\s+/).length : 1;
  const keywordDensity =
    wordCount > 0 && keywordCount > 0
      ? Number(((keywordCount * keywordWordCount / wordCount) * 100).toFixed(2))
      : 0;

  const headingAnalysis = analyzeHeadings(content);

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    fleschScore,
    fleschLabel,
    keywordCount,
    keywordDensity,
    inTitle,
    inFirst100,
    inHeadings,
    h1Count: headingAnalysis.h1Count,
    headingsLogicalOrder: headingAnalysis.isLogicalOrder,
    headingIssues: headingAnalysis.issues,
    headingsList: headingAnalysis.headings,
    thinContentWarning: wordCount < 100,
  };
}

/**
 * Realistic sample page for a Doha-based dental clinic with a thin title, no meta,
 * and broken heading structure.
 */
export const SAMPLE_DOHA_PAGE = {
  url: 'https://dohadentalcare.qa/treatments',
  title: 'Home - Dental Clinic',
  metaDescription: '',
  targetKeyword: 'dentist in doha',
  secondaryKeywords: 'teeth whitening doha, dental clinic qatar',
  content: `# Welcome to Our Clinic

We are the premier dental facility providing tooth care solutions to all individuals in our locality. Our qualified professionals are deeply dedicated to the perpetual enhancement of oral hygiene. If you necessitate specialized tooth solutions or emergency consults, contact us without hesitation.

### Our Dental Services
- Tooth Cleaning
- Routine Checkups
- Cavity Fillings

We have been serving customers for a while. Our clinical treatments utilize advanced apparatus to alleviate pain and deliver comprehensive restorative dentistry. Contact our reception desk to secure an appointment now.`,
};

/**
 * Builds a clean Markdown report for exporting the audit.
 */
export function generateMarkdownReport(
  payload: {
    title: string;
    pageUrl?: string;
    targetKeyword: string;
    secondaryKeywords: string[];
    metrics: BrowserMetrics;
    audit: AuditResult;
  }
): string {
  const { title, pageUrl, targetKeyword, secondaryKeywords, metrics, audit } = payload;
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `# Page Auditor — SEO & Content Audit Report
**Date:** ${dateStr}  
${pageUrl ? `**URL:** ${pageUrl}  \n` : ''}**Page Title:** ${title || '(Not specified)'}  
**Target Keyword:** \`${targetKeyword}\`  
**Secondary Keywords:** ${secondaryKeywords.length > 0 ? secondaryKeywords.map(k => `\`${k}\``).join(', ') : 'None'}

---

## 1. Executive Summary
- **Overall SEO Score:** **${audit.overall_score} / 100**
- **Verdict:** ${audit.verdict}

---

## 2. On-Page Heuristics (Pre-Audit Metrics)
| Metric | Value | Status |
| :--- | :--- | :--- |
| **Word Count** | ${metrics.wordCount} words | ${metrics.thinContentWarning ? '⚠️ Thin content (<100 words)' : '✅ Sufficient length'} |
| **Readability (Flesch)** | ${metrics.fleschScore} / 100 (${metrics.fleschLabel}) | ${metrics.fleschScore >= 60 ? '✅ Readable' : '⚠️ Dense/Complex'} |
| **Avg Sentence Length** | ${metrics.avgSentenceLength} words/sentence | ${metrics.avgSentenceLength <= 20 ? '✅ Good rhythm' : '⚠️ Long sentences'} |
| **Keyword Frequency** | ${metrics.keywordCount} occurrences (${metrics.keywordDensity}%) | ${metrics.keywordCount > 0 ? 'Found' : '❌ Not found'} |
| **Keyword in Title** | ${metrics.inTitle ? 'Yes' : 'No'} | ${metrics.inTitle ? '✅ Optimized' : '❌ Missing'} |
| **Keyword in First 100 Words** | ${metrics.inFirst100 ? 'Yes' : 'No'} | ${metrics.inFirst100 ? '✅ Found early' : '⚠️ Missing early'} |
| **Keyword in Headings** | ${metrics.inHeadings ? 'Yes' : 'No'} | ${metrics.inHeadings ? '✅ Present' : '⚠️ Not in headings'} |
| **H1 Tag Status** | ${metrics.h1Count} H1 found | ${metrics.h1Count === 1 ? '✅ Exactly 1 H1' : '⚠️ Fix required'} |
| **Heading Hierarchy** | ${metrics.headingsLogicalOrder ? 'Logical order' : 'Illogical order'} | ${metrics.headingsLogicalOrder ? '✅ Clean' : '⚠️ Skips levels'} |

${metrics.headingIssues.length > 0 ? `\n### Heading Issues Detected:\n${metrics.headingIssues.map(i => `- ${i}`).join('\n')}\n` : ''}

---

## 3. Title Tag Suggestions (< 60 Characters)
${audit.title_suggestions
  .map(
    (t, idx) =>
      `**Option ${idx + 1}** (${t.length} chars):\n> \`${t}\`\n`
  )
  .join('\n')}

---

## 4. Meta Description Suggestions (< 155 Characters)
${audit.meta_description_suggestions
  .map(
    (m, idx) =>
      `**Option ${idx + 1}** (${m.length} chars):\n> "${m}"\n`
  )
  .join('\n')}

---

## 5. Keyword Gaps & Search Intent Opportunities
${audit.keyword_gaps
  .map(
    gap =>
      `- **[${gap.type.toUpperCase()}]** \`${gap.termOrQuestion}\`  \n  *Why:* ${gap.reason}`
  )
  .join('\n\n')}

---

## 6. Readability Improvements & Rewrites
${audit.readability_notes
  .map(
    (item, idx) =>
      `### Example ${idx + 1}
**Original:**
> "${item.original}"

**Simplified Rewrite:**
> "${item.rewrite}"

*Reason:* ${item.reason}
`
  )
  .join('\n')}

---

## 7. Prioritized Action Plan
${audit.fix_list
  .map(
    fix =>
      `- **[${fix.priority.toUpperCase()}]** ${fix.action}  \n  *Rationale:* ${fix.reason}`
  )
  .join('\n\n')}

---
*Generated by Page Auditor on ${dateStr}.*
`;
}
