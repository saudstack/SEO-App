/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserMetrics,
  HeadingAnalysis,
  HeadingItem,
  AuditResult,
  CompetitorData,
  CompetitorMetricDiff,
  CompetitorComparisonResult,
} from '../types/seo';

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
 * Realistic ranking competitor for "dentist in doha" benchmark.
 */
export const SAMPLE_COMPETITOR_PAGE = {
  url: 'https://almeezandental.qa/dentist-in-doha',
  title: 'Top Rated Dentist in Doha, Qatar | Comprehensive Dental Care',
  metaDescription:
    'Looking for a compassionate, experienced dentist in Doha? We provide 24/7 emergency care, gentle teeth whitening, dental implants, and pediatric dentistry.',
  targetKeyword: 'dentist in doha',
  content: `# Best Dentist in Doha: Premium Dental Care & Family Treatments

Welcome to our accredited dental center located in West Bay, Doha. Finding an experienced, certified dentist in Doha is essential for maintaining lifelong oral hygiene, confident smiles, and pain-free preventative wellness. Our clinic unites board-certified specialists, low-radiation digital 3D imaging, and gentle patient-focused treatment rooms.

Whether you need routine tartar cleaning, urgent relief from a severe toothache, dental implants, or cosmetic smile restoration, our Doha team is dedicated to providing anxiety-free care for the entire family.

## Comprehensive Dental Treatments in Doha

We deliver a complete spectrum of preventative, cosmetic, and surgical dental services tailored for residents and visitors in Qatar:

### 1. General & Preventative Dentistry
Routine examinations and timely cleanings prevent gum disease and decay before expensive complications emerge:
- Ultrasonic scaling, plaque debridement, and stain removal
- Digital panoramic X-rays and low-dose intraoral imaging
- Fluoride treatments and preventative tooth sealants for children
- Natural tooth-colored composite restorations

### 2. Cosmetic Dentistry & In-Office Whitening
Transform your smile with fast, minimally invasive aesthetic procedures:
- Advanced in-office laser teeth whitening (up to 7 shades brighter in 45 minutes)
- Custom porcelain veneers and composite enamel bonding
- Invisible clear aligners for adults and teenagers

### 3. Emergency Dental Care & Urgent Consultations
Sudden oral injuries and severe toothaches require immediate clinical intervention. We reserve daily slots for urgent consultations, cracked teeth, and emergency root canal therapy across Doha.

## Why Patients Recommend Our Doha Dental Clinic
- Multilingual dental surgeons fluent in Arabic, English, and French
- Transparent price schedules with direct insurance billing across Qatar
- Convenient evening appointments and complimentary valet parking

Schedule your checkup with a leading dentist in Doha today and experience modern, patient-first dental excellence.`,
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
**Recommended Slug:** \`${audit.url_slug_suggestion || '/page'}\`  
**Target Keyword:** \`${targetKeyword}\`  
**Secondary Keywords:** ${secondaryKeywords.length > 0 ? secondaryKeywords.map(k => `\`${k}\``).join(', ') : 'None'}

---

## 1. Executive Summary
- **Overall SEO Score:** **${audit.overall_score} / 100**
- **Verdict:** ${audit.verdict}

### Score Breakdown:
- **Content Depth & Volume:** ${audit.score_breakdown?.content_depth ?? 'N/A'} / 100
- **Readability & Cadence:** ${audit.score_breakdown?.readability ?? 'N/A'} / 100
- **Keyword Optimization:** ${audit.score_breakdown?.keyword_optimization ?? 'N/A'} / 100
- **Heading Structure & Hierarchy:** ${audit.score_breakdown?.heading_structure ?? 'N/A'} / 100

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

## 5. Heading Structure & Recommended Outline
**Recommended Primary H1:**
> #${audit.heading_recommendations?.h1_suggestion || title || ' ' + targetKeyword}

### Recommended Section Outline:
${(audit.heading_recommendations?.recommended_outline || [])
  .map(
    item =>
      `- **${item.level}:** ${item.heading}  \n  *Purpose:* ${item.purpose}`
  )
  .join('\n\n')}

---

## 6. Keyword Gaps & Search Intent Opportunities
${audit.keyword_gaps
  .map(
    gap =>
      `- **[${gap.type.toUpperCase()}]** \`${gap.termOrQuestion}\`  \n  *Why:* ${gap.reason}`
  )
  .join('\n\n')}

---

## 7. Readability Improvements & Rewrites
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

## 8. Prioritized Action Plan
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

/**
 * Builds a formatted JSON export of the entire audit.
 */
export function generateJsonReport(payload: {
  title: string;
  pageUrl?: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  metrics: BrowserMetrics;
  audit: AuditResult;
}): string {
  const exportData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      tool: 'Page Auditor',
      version: '1.0.0',
    },
    input: {
      pageUrl: payload.pageUrl || null,
      pageTitle: payload.title || null,
      targetKeyword: payload.targetKeyword,
      secondaryKeywords: payload.secondaryKeywords,
    },
    metrics: payload.metrics,
    audit: payload.audit,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Builds a structured head-to-head metric comparison between the audited page and a competitor.
 */
export function buildCompetitorComparison(params: {
  yourMetrics: BrowserMetrics;
  yourTitle: string;
  yourMeta: string;
  yourUrl?: string;
  competitor: CompetitorData;
  targetKeyword: string;
}): CompetitorComparisonResult {
  const { yourMetrics, yourTitle, yourMeta, competitor, targetKeyword } = params;
  const compMetrics = competitor.metrics;

  const diffs: CompetitorMetricDiff[] = [];

  // 1. Word Count & Content Depth
  const wordDiff = yourMetrics.wordCount - compMetrics.wordCount;
  let wordWinner: 'you' | 'competitor' | 'tie' = 'tie';
  if (Math.abs(wordDiff) > 50) {
    wordWinner = wordDiff > 0 ? 'you' : 'competitor';
  }
  diffs.push({
    metric: 'Word Count & Content Depth',
    category: 'content',
    yourValue: `${yourMetrics.wordCount} words`,
    competitorValue: `${compMetrics.wordCount} words`,
    winner: wordWinner,
    diffText:
      wordDiff === 0
        ? 'Exact match'
        : `${wordDiff > 0 ? '+' : ''}${wordDiff} words (${Math.round(
            (yourMetrics.wordCount / Math.max(1, compMetrics.wordCount)) * 100
          )}% of competitor)`,
    insight:
      wordWinner === 'competitor'
        ? `Competitor provides significantly deeper coverage (+${Math.abs(
            wordDiff
          )} words). Expanding content depth helps satisfy search intent.`
        : wordWinner === 'you'
        ? `Your page has superior content volume (+${wordDiff} words). Ensure every section retains high informational value.`
        : 'Both pages have comparable content volume.',
  });

  // 2. Flesch Reading Ease
  const fleschDiff = yourMetrics.fleschScore - compMetrics.fleschScore;
  let fleschWinner: 'you' | 'competitor' | 'tie' = 'tie';
  const yourDistance = Math.abs(yourMetrics.fleschScore - 65);
  const compDistance = Math.abs(compMetrics.fleschScore - 65);
  if (Math.abs(yourDistance - compDistance) > 5) {
    fleschWinner = yourDistance < compDistance ? 'you' : 'competitor';
  }
  diffs.push({
    metric: 'Readability (Flesch Score)',
    category: 'readability',
    yourValue: `${yourMetrics.fleschScore} / 100 (${yourMetrics.fleschLabel})`,
    competitorValue: `${compMetrics.fleschScore} / 100 (${compMetrics.fleschLabel})`,
    winner: fleschWinner,
    diffText: `${fleschDiff > 0 ? '+' : ''}${fleschDiff} pts difference`,
    insight:
      yourMetrics.fleschScore < 55
        ? 'Your content is denser and harder to read. Simplify vocabulary and shorten complex sentences.'
        : compMetrics.fleschScore < 55
        ? 'Your readability score is higher and clearer for everyday web readers than your competitor.'
        : 'Both pages maintain accessible readability for mainstream audiences.',
  });

  // 3. Average Sentence Length
  const sentDiff = Number((yourMetrics.avgSentenceLength - compMetrics.avgSentenceLength).toFixed(1));
  let sentWinner: 'you' | 'competitor' | 'tie' = 'tie';
  if (Math.abs(sentDiff) > 2) {
    const yourSentDist = Math.abs(yourMetrics.avgSentenceLength - 16);
    const compSentDist = Math.abs(compMetrics.avgSentenceLength - 16);
    sentWinner = yourSentDist < compSentDist ? 'you' : 'competitor';
  }
  diffs.push({
    metric: 'Average Sentence Length',
    category: 'readability',
    yourValue: `${yourMetrics.avgSentenceLength} words/sentence`,
    competitorValue: `${compMetrics.avgSentenceLength} words/sentence`,
    winner: sentWinner,
    diffText: `${sentDiff > 0 ? '+' : ''}${sentDiff} words`,
    insight:
      yourMetrics.avgSentenceLength > 20
        ? 'Your sentences run longer than standard web scannability guidelines (aim for 14-18 words per sentence).'
        : 'Your sentence length fosters clear cadence and scannability.',
  });

  // 4. Target Keyword Frequency & Density
  const densityDiff = Number((yourMetrics.keywordDensity - compMetrics.keywordDensity).toFixed(2));
  let densityWinner: 'you' | 'competitor' | 'tie' = 'tie';
  const yourDensityDist =
    yourMetrics.keywordDensity < 1.0
      ? 1.0 - yourMetrics.keywordDensity
      : yourMetrics.keywordDensity > 2.5
      ? yourMetrics.keywordDensity - 2.5
      : 0;
  const compDensityDist =
    compMetrics.keywordDensity < 1.0
      ? 1.0 - compMetrics.keywordDensity
      : compMetrics.keywordDensity > 2.5
      ? compMetrics.keywordDensity - 2.5
      : 0;
  if (Math.abs(yourDensityDist - compDensityDist) > 0.3) {
    densityWinner = yourDensityDist < compDensityDist ? 'you' : 'competitor';
  }
  diffs.push({
    metric: 'Target Keyword Density',
    category: 'keywords',
    yourValue: `${yourMetrics.keywordCount}x (${yourMetrics.keywordDensity}%)`,
    competitorValue: `${compMetrics.keywordCount}x (${compMetrics.keywordDensity}%)`,
    winner: densityWinner,
    diffText: `${densityDiff > 0 ? '+' : ''}${densityDiff}% density`,
    insight:
      yourMetrics.keywordDensity < 0.8
        ? `Under-optimized keyword usage (${yourMetrics.keywordCount}x vs competitor's ${compMetrics.keywordCount}x). Naturally incorporate '${targetKeyword}' into relevant subheadings and paragraphs.`
        : yourMetrics.keywordDensity > 3.0
        ? 'Potential keyword over-optimization detected. Ensure usage feels conversational rather than repetitive.'
        : 'Your keyword density is well-balanced within the 1.0%–2.5% safe optimization band.',
  });

  // 5. Keyword in Title Tag
  const titleHasKeyword = yourMetrics.inTitle;
  const compTitleHasKeyword = compMetrics.inTitle;
  const titleWinner =
    titleHasKeyword === compTitleHasKeyword ? 'tie' : titleHasKeyword ? 'you' : 'competitor';
  diffs.push({
    metric: 'Target Keyword in Title Tag',
    category: 'keywords',
    yourValue: titleHasKeyword ? 'Yes' : 'Missing',
    competitorValue: compTitleHasKeyword ? 'Yes' : 'Missing',
    winner: titleWinner,
    diffText:
      titleWinner === 'tie'
        ? 'Matched'
        : titleWinner === 'you'
        ? 'Your Advantage'
        : 'Competitor Advantage',
    insight:
      !titleHasKeyword && compTitleHasKeyword
        ? `Competitor has the keyword in their title. Title tags are among the strongest on-page ranking signals.`
        : titleHasKeyword && !compTitleHasKeyword
        ? `You have a direct keyword advantage in the title tag.`
        : 'Both pages have equal keyword presence in the title tag.',
  });

  // 6. Keyword in First 100 Words
  const f100Winner =
    yourMetrics.inFirst100 === compMetrics.inFirst100
      ? 'tie'
      : yourMetrics.inFirst100
      ? 'you'
      : 'competitor';
  diffs.push({
    metric: 'Keyword in First 100 Words',
    category: 'keywords',
    yourValue: yourMetrics.inFirst100 ? 'Found early' : 'Missing',
    competitorValue: compMetrics.inFirst100 ? 'Found early' : 'Missing',
    winner: f100Winner,
    diffText:
      f100Winner === 'tie' ? 'Matched' : f100Winner === 'you' ? 'Your Advantage' : 'Competitor Advantage',
    insight:
      !yourMetrics.inFirst100 && compMetrics.inFirst100
        ? 'Competitor establishes topical relevance in their introductory paragraph. Add the keyword in your first 100 words.'
        : 'Topical relevance is established early in the opening copy.',
  });

  // 7. Keyword in Headings
  const headWinner =
    yourMetrics.inHeadings === compMetrics.inHeadings
      ? 'tie'
      : yourMetrics.inHeadings
      ? 'you'
      : 'competitor';
  diffs.push({
    metric: 'Keyword in Headings',
    category: 'headings',
    yourValue: yourMetrics.inHeadings ? 'Present' : 'Missing',
    competitorValue: compMetrics.inHeadings ? 'Present' : 'Missing',
    winner: headWinner,
    diffText:
      headWinner === 'tie' ? 'Matched' : headWinner === 'you' ? 'Your Advantage' : 'Competitor Advantage',
    insight:
      !yourMetrics.inHeadings && compMetrics.inHeadings
        ? 'Competitor reinforces relevance by including keyword variations in headings.'
        : 'Good heading keyword optimization.',
  });

  // 8. Heading Structure & Hierarchy
  const yourH1Valid = yourMetrics.h1Count === 1;
  const compH1Valid = compMetrics.h1Count === 1;
  const h1Winner =
    yourH1Valid === compH1Valid &&
    yourMetrics.headingsLogicalOrder === compMetrics.headingsLogicalOrder
      ? 'tie'
      : yourH1Valid && yourMetrics.headingsLogicalOrder
      ? 'you'
      : 'competitor';
  diffs.push({
    metric: 'Heading Structure & Hierarchy',
    category: 'headings',
    yourValue: `${yourMetrics.h1Count} H1, ${yourMetrics.headingsList.length} total (${
      yourMetrics.headingsLogicalOrder ? 'Clean' : 'Issues'
    })`,
    competitorValue: `${compMetrics.h1Count} H1, ${compMetrics.headingsList.length} total (${
      compMetrics.headingsLogicalOrder ? 'Clean' : 'Issues'
    })`,
    winner: h1Winner,
    diffText: `${yourMetrics.headingsList.length} vs ${compMetrics.headingsList.length} headings`,
    insight:
      !yourMetrics.headingsLogicalOrder
        ? 'Your heading hierarchy skips levels. A clean H1 -> H2 -> H3 outline clarifies document architecture for crawlers.'
        : 'Clean semantic heading hierarchy maintained.',
  });

  // 9. Meta Description Optimization
  const yourMetaLen = (yourMeta || '').trim().length;
  const compMetaLen = (competitor.metaDescription || '').trim().length;
  const yourMetaValid = yourMetaLen >= 70 && yourMetaLen <= 160;
  const compMetaValid = compMetaLen >= 70 && compMetaLen <= 160;
  let metaWinner: 'you' | 'competitor' | 'tie' = 'tie';
  if (yourMetaValid !== compMetaValid) {
    metaWinner = yourMetaValid ? 'you' : 'competitor';
  } else if (!yourMetaLen && compMetaLen) {
    metaWinner = 'competitor';
  }
  diffs.push({
    metric: 'Meta Description Optimization',
    category: 'content',
    yourValue: yourMetaLen > 0 ? `${yourMetaLen} chars` : 'Missing (0 chars)',
    competitorValue: compMetaLen > 0 ? `${compMetaLen} chars` : 'Missing (0 chars)',
    winner: metaWinner,
    diffText: `${yourMetaLen} vs ${compMetaLen} chars`,
    insight:
      yourMetaLen === 0
        ? 'Your page lacks a dedicated meta description tag, leading to auto-generated SERP snippets and lower CTR.'
        : yourMetaLen > 160
        ? 'Your meta description exceeds Google snippet cut-off (~160 chars).'
        : 'Your meta description length is within recommended desktop & mobile limits.',
  });

  // Summary calculation
  let yourWins = 0;
  let competitorWins = 0;
  let ties = 0;
  for (const d of diffs) {
    if (d.winner === 'you') yourWins++;
    else if (d.winner === 'competitor') competitorWins++;
    else ties++;
  }

  let verdict = '';
  if (competitorWins > yourWins) {
    verdict = `Competitor holds the advantage in ${competitorWins} of ${diffs.length} key areas. Focus on matching content depth and fixing on-page keyword placement.`;
  } else if (yourWins > competitorWins) {
    verdict = `Your page outperforms the competitor in ${yourWins} of ${diffs.length} key areas. Maintain this lead while refining any secondary gaps.`;
  } else {
    verdict = `Competitive parity: Tied in multiple areas. Differentiate by addressing thin sections and enhancing click appeal.`;
  }

  // Derive strategic actionable insights
  const actionableInsights: string[] = [];
  if (wordWinner === 'competitor') {
    actionableInsights.push(
      `Content Depth Gap: Competitor has ${compMetrics.wordCount} words vs your ${yourMetrics.wordCount} words. Expand your page by at least ${Math.abs(
        wordDiff
      )} words with detailed service explanations and FAQ sections.`
    );
  }
  if (!titleHasKeyword && compTitleHasKeyword) {
    actionableInsights.push(
      `Title Tag Gap: Place '${targetKeyword}' prominently in your title tag near the beginning, followed by your brand or location.`
    );
  }
  if (yourMetaLen === 0 && compMetaLen > 0) {
    actionableInsights.push(
      `Snippet CTR Gap: Add a compelling 140–155 character meta description containing '${targetKeyword}' and a clear call-to-action.`
    );
  }
  if (!yourH1Valid || !yourMetrics.headingsLogicalOrder) {
    actionableInsights.push(
      `Heading Architecture Gap: Standardize to exactly 1 H1 containing the target keyword, followed by organized H2 and H3 subsections.`
    );
  }
  if (!yourMetrics.inHeadings && compMetrics.inHeadings) {
    actionableInsights.push(
      `Subheading Optimization Gap: Include '${targetKeyword}' or related phrase entities in at least one H2 section.`
    );
  }
  if (fleschWinner === 'competitor' && yourMetrics.fleschScore < 55) {
    actionableInsights.push(
      `Readability Gap: Your reading score (${yourMetrics.fleschScore}) is significantly lower than competitor's (${compMetrics.fleschScore}). Break long sentences and shorten syllables.`
    );
  }
  if (actionableInsights.length === 0) {
    actionableInsights.push(
      `Topical Dominance: Your on-page heuristics lead or match the competitor across all major categories. Focus on search intent satisfaction, internal linking, and fresh reviews.`
    );
  }

  return {
    competitor,
    metricsComparison: diffs,
    summary: {
      yourWins,
      competitorWins,
      ties,
      verdict,
    },
    actionableInsights,
  };
}

/**
 * Builds a clean Markdown report comparing the audited page against the competitor.
 */
export function generateCompetitorMarkdownReport(
  comparison: CompetitorComparisonResult,
  targetKeyword: string,
  yourTitle?: string,
  yourUrl?: string
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `# Page Auditor — Head-to-Head Competitor Comparison
**Date:** ${dateStr}  
**Target Keyword:** \`${targetKeyword}\`  
**Your Page:** ${yourTitle || '(Audited Page)'} ${yourUrl ? `(${yourUrl})` : ''}  
**Competitor:** ${comparison.competitor.title || '(Competitor Page)'} (${comparison.competitor.url})

---

## 1. Executive Scoreboard
- **Your Wins:** ${comparison.summary.yourWins}
- **Competitor Wins:** ${comparison.summary.competitorWins}
- **Tied Metrics:** ${comparison.summary.ties}
- **Verdict:** ${comparison.summary.verdict}

---

## 2. Metric-by-Metric Comparison Table
| Metric | Your Page | Competitor | Winner / Advantage | Key Insight |
| :--- | :--- | :--- | :--- | :--- |
${comparison.metricsComparison
  .map(
    m =>
      `| **${m.metric}** | ${m.yourValue} | ${m.competitorValue} | ${
        m.winner === 'you'
          ? '🏆 You'
          : m.winner === 'competitor'
          ? '⚡ Competitor'
          : '🤝 Tie'
      } (${m.diffText}) | ${m.insight} |`
  )
  .join('\n')}

---

## 3. Priority Takeaways to Outrank This Competitor
${comparison.actionableInsights.map(item => `- ${item}`).join('\n')}

---
*Generated by Page Auditor Competitor Intelligence.*
`;
}
