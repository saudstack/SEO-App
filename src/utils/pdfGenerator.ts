/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { AuditResult, BrowserMetrics, FixItem, KeywordGap } from '../types/seo';

export interface GeneratePdfOptions {
  pageUrl?: string;
  targetKeyword: string;
  secondaryKeywords?: string[];
  metrics: BrowserMetrics;
  audit: AuditResult;
  title?: string;
}

/**
 * Generates a clean, modern, multi-page PDF audit report using jsPDF.
 */
export function generatePdfReport(options: GeneratePdfOptions): void {
  const { pageUrl, targetKeyword, secondaryKeywords = [], metrics, audit, title } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const leftMargin = 16;
  const rightMargin = 16;
  const contentWidth = pageWidth - leftMargin - rightMargin; // 178mm
  const bottomMargin = 18;

  let y = 16;

  // Helper to check page break
  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      y = 16;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Page Auditor · SEO Audit Report', leftMargin, 10);
    if (pageUrl) {
      const cleanUrl = pageUrl.length > 50 ? pageUrl.substring(0, 47) + '...' : pageUrl;
      doc.text(cleanUrl, pageWidth - rightMargin, 10, { align: 'right' });
    }
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.line(leftMargin, 12, pageWidth - rightMargin, 12);
  };

  const drawSectionTitle = (titleText: string, subtitle?: string) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(titleText, leftMargin, y);
    y += 5;

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(subtitle, leftMargin, y);
      y += 4.5;
    }

    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(leftMargin, y, leftMargin + contentWidth, y);
    y += 6;
  };

  // 1. TOP HEADER BANNER
  // Header background card
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(leftMargin, y, contentWidth, 26, 3, 3, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('PAGE AUDITOR', leftMargin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('COMPREHENSIVE ON-PAGE SEO AUDIT REPORT', leftMargin + 6, y + 15);

  // Date on top right of banner
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`DATE: ${dateStr.toUpperCase()}`, leftMargin + contentWidth - 6, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Heuristics & AI Analysis', leftMargin + contentWidth - 6, y + 15, { align: 'right' });

  // Target keyword pill in header
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  const kwText = `Target Keyword: "${targetKeyword}"${secondaryKeywords.length ? ` · Secondary: ${secondaryKeywords.slice(0, 3).join(', ')}` : ''}`;
  const truncatedKw = kwText.length > 80 ? kwText.substring(0, 77) + '...' : kwText;
  doc.text(truncatedKw, leftMargin + 6, y + 21);

  y += 30;

  // 2. PAGE URL & METADATA BAR
  if (pageUrl || title) {
    ensureSpace(14);
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(leftMargin, y, contentWidth, 12, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('AUDITED PAGE:', leftMargin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const displayUrl = pageUrl || (title ? `Page: "${title}"` : 'Direct text input');
    const safeDisplayUrl = displayUrl.length > 75 ? displayUrl.substring(0, 72) + '...' : displayUrl;
    doc.text(safeDisplayUrl, leftMargin + 32, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('STATUS:', leftMargin + 4, y + 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Analysis Complete · All Heuristics Calculated', leftMargin + 32, y + 9.5);

    y += 16;
  }

  // 3. OVERALL SCORE & VERDICT
  ensureSpace(34);
  const scoreCardHeight = 28;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftMargin, y, contentWidth, scoreCardHeight, 3, 3, 'FD');

  // Score badge
  const score = audit.overall_score;
  let scoreColor: [number, number, number] = [16, 185, 129]; // emerald
  let scoreBg: [number, number, number] = [236, 253, 245];
  if (score < 60) {
    scoreColor = [225, 29, 72]; // rose
    scoreBg = [255, 241, 242];
  } else if (score < 80) {
    scoreColor = [217, 119, 6]; // amber
    scoreBg = [254, 243, 199];
  }

  // Score box on left
  doc.setFillColor(scoreBg[0], scoreBg[1], scoreBg[2]);
  doc.setDrawColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(leftMargin + 4, y + 4, 30, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`${score}`, leftMargin + 19, y + 13, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('/ 100', leftMargin + 19, y + 18, { align: 'center' });

  // Verdict & breakdown on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('SEO SCORE VERDICT', leftMargin + 38, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const splitVerdict = doc.splitTextToSize(audit.verdict || 'Analysis completed.', contentWidth - 42);
  doc.text(splitVerdict.slice(0, 2), leftMargin + 38, y + 13);

  // Pillar scores if available
  if (audit.score_breakdown) {
    const pillars = [
      { name: 'Content', val: audit.score_breakdown.content_depth },
      { name: 'Readability', val: audit.score_breakdown.readability },
      { name: 'Keywords', val: audit.score_breakdown.keyword_optimization },
      { name: 'Headings', val: audit.score_breakdown.heading_structure },
    ];
    let px = leftMargin + 38;
    for (const p of pillars) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`${p.name}:`, px, y + 23);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(p.val >= 75 ? 16 : p.val >= 55 ? 180 : 220, p.val >= 75 ? 140 : p.val >= 55 ? 100 : 38, 38);
      doc.text(`${p.val}/100`, px + 17, y + 23);
      px += 33;
    }
  }

  y += scoreCardHeight + 8;

  // 4. BASIC DIAGNOSTICS SECTION
  drawSectionTitle('Basic On-Page Diagnostics', 'Calculated browser metrics based on body text and page structure');

  const diagColWidth = (contentWidth - 6) / 4;
  const diagBoxHeight = 18;
  ensureSpace(diagBoxHeight + 6);

  const diagItems = [
    {
      label: 'CONTENT VOLUME',
      primary: `${metrics.wordCount} words`,
      secondary: `${metrics.sentenceCount} sentences`,
    },
    {
      label: 'READING EASE',
      primary: `${metrics.fleschScore}/100`,
      secondary: metrics.fleschLabel,
    },
    {
      label: 'AVG SENTENCE LENGTH',
      primary: `${metrics.avgSentenceLength} words`,
      secondary: metrics.avgSentenceLength <= 20 ? 'Optimal length' : 'Dense sentences',
    },
    {
      label: 'KEYWORD DENSITY',
      primary: `${metrics.keywordDensity}%`,
      secondary: `${metrics.keywordCount} occurrences`,
    },
  ];

  for (let i = 0; i < diagItems.length; i++) {
    const item = diagItems[i];
    const bx = leftMargin + i * (diagColWidth + 2);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(bx, y, diagColWidth, diagBoxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, bx + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(item.primary, bx + 3, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(item.secondary, bx + 3, y + 15);
  }

  y += diagBoxHeight + 4;

  // Extra diagnostic checks line
  ensureSpace(10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const h1Status = metrics.h1Count === 1 ? '✓ Single H1 declared' : `⚠ ${metrics.h1Count} H1 tags detected`;
  const inTitleStatus = metrics.inTitle ? '✓ In Title' : '⚠ Missing from Title';
  const inIntroStatus = metrics.inFirst100 ? '✓ In First 100 Words' : '⚠ Missing from Intro';
  const headingStatus = metrics.headingsLogicalOrder ? '✓ Logical Heading Hierarchy' : '⚠ Heading order skipped';

  doc.text(`Structural Checklist:  ${h1Status}   ·   ${inTitleStatus}   ·   ${inIntroStatus}   ·   ${headingStatus}`, leftMargin + 2, y + 4);
  y += 10;

  // 5. SUGGESTED TITLES & META DESCRIPTIONS
  drawSectionTitle('Suggested Titles & Meta Descriptions', 'High-click organic snippets targeting primary keywords within length constraints');

  // Titles
  ensureSpace(24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229); // indigo-600
  doc.text('SUGGESTED TITLE TAGS (Target: Under 60 chars)', leftMargin, y);
  y += 5;

  const titleSuggestions = audit.title_suggestions || [];
  titleSuggestions.forEach((t, idx) => {
    ensureSpace(10);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(leftMargin, y, contentWidth, 7.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Option ${idx + 1}:`, leftMargin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const maxTWidth = contentWidth - 32;
    const splitT = doc.splitTextToSize(t, maxTWidth);
    doc.text(splitT[0] || t, leftMargin + 20, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(t.length <= 60 ? 16 : 220, t.length <= 60 ? 140 : 38, 38);
    doc.text(`${t.length} chars`, leftMargin + contentWidth - 4, y + 5, { align: 'right' });

    y += 9;
  });

  y += 2;

  // Meta descriptions
  ensureSpace(26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('SUGGESTED META DESCRIPTIONS (Target: Under 155 chars)', leftMargin, y);
  y += 5;

  const metaSuggestions = audit.meta_description_suggestions || [];
  metaSuggestions.forEach((m, idx) => {
    const splitM = doc.splitTextToSize(m, contentWidth - 30);
    const boxH = Math.max(8.5, splitM.length * 4 + 4);
    ensureSpace(boxH + 2);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(leftMargin, y, contentWidth, boxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Option ${idx + 1}:`, leftMargin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(splitM, leftMargin + 20, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(m.length <= 155 ? 16 : 220, m.length <= 155 ? 140 : 38, 38);
    doc.text(`${m.length}c`, leftMargin + contentWidth - 3, y + 5, { align: 'right' });

    y += boxH + 2;
  });

  y += 4;

  // 6. KEYWORD GAPS
  const gaps = audit.keyword_gaps || [];
  if (gaps.length > 0) {
    drawSectionTitle('Keyword Gaps & Search Intent Opportunities', 'Missing semantic terms, related entities, and search questions');

    gaps.slice(0, 6).forEach((gap: KeywordGap) => {
      const splitReason = doc.splitTextToSize(gap.reason, contentWidth - 52);
      const rowHeight = Math.max(9, splitReason.length * 3.8 + 4.5);
      ensureSpace(rowHeight + 2);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(leftMargin, y, contentWidth, rowHeight, 1.5, 1.5, 'FD');

      // Tag for term vs question
      const isQuestion = gap.type === 'question';
      doc.setFillColor(isQuestion ? 238 : 241, isQuestion ? 242 : 245, isQuestion ? 255 : 249);
      doc.roundedRect(leftMargin + 3, y + 2.5, 16, 5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(isQuestion ? 79 : 100, isQuestion ? 70 : 116, isQuestion ? 229 : 139);
      doc.text(isQuestion ? 'QUESTION' : 'TERM', leftMargin + 11, y + 6, { align: 'center' });

      // Keyword term text
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      const termTrunc = gap.termOrQuestion.length > 30 ? gap.termOrQuestion.substring(0, 28) + '...' : gap.termOrQuestion;
      doc.text(termTrunc, leftMargin + 22, y + 6.2);

      // Reason text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(splitReason, leftMargin + 50, y + 5.5);

      y += rowHeight + 1.5;
    });

    y += 4;
  }

  // 7. PRIORITIZED ACTION PLAN
  const fixes = audit.fix_list || [];
  if (fixes.length > 0) {
    drawSectionTitle('Prioritized Action Plan', 'Ranked roadmap of actionable recommendations categorized by impact');

    fixes.forEach((fix: FixItem) => {
      const splitAction = doc.splitTextToSize(fix.action, contentWidth - 28);
      const splitReason = doc.splitTextToSize(`Impact: ${fix.reason}`, contentWidth - 28);
      const itemHeight = Math.max(14, (splitAction.length + splitReason.length) * 3.8 + 6);

      ensureSpace(itemHeight + 2);

      // Card container
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(leftMargin, y, contentWidth, itemHeight, 1.5, 1.5, 'FD');

      // Priority badge
      const prio = fix.priority.toLowerCase();
      let badgeBg: [number, number, number] = [241, 245, 249];
      let badgeText: [number, number, number] = [100, 116, 139];
      if (prio === 'high') {
        badgeBg = [255, 241, 242];
        badgeText = [225, 29, 72];
      } else if (prio === 'medium') {
        badgeBg = [254, 243, 199];
        badgeText = [217, 119, 6];
      }

      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.roundedRect(leftMargin + 3, y + 3, 16, 5, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
      doc.text(fix.priority.toUpperCase(), leftMargin + 11, y + 6.6, { align: 'center' });

      // Action Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(splitAction, leftMargin + 22, y + 6);

      // Impact reason
      const actionLinesHeight = splitAction.length * 3.8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      doc.text(splitReason, leftMargin + 22, y + 6 + actionLinesHeight + 0.5);

      y += itemHeight + 2;
    });

    y += 4;
  }

  // 8. ADD PAGE NUMBERS & FOOTERS TO ALL PAGES
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMargin, pageHeight - 12, leftMargin + contentWidth, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Page Auditor · Structured On-Page Heuristics & Content Intelligence', leftMargin, pageHeight - 8);
    doc.text(`Page ${p} of ${totalPages}`, leftMargin + contentWidth, pageHeight - 8, { align: 'right' });
  }

  // Trigger download with cross-browser and iframe compatibility
  const cleanKeyword = targetKeyword.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'seo-report';
  const filename = `page-audit-${cleanKeyword}.pdf`;

  try {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } else {
      doc.save(filename);
    }
  } catch (e) {
    doc.save(filename);
  }
}
