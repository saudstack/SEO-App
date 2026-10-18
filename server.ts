/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { AuditRequestPayload } from './src/types/seo';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Lowered JSON limit from 10mb to 1mb for safety against payload bloating
app.use(express.json({ limit: '1mb' }));

const port = Number(process.env.PORT) || 3000;

// Maximum allowed input lengths
const MAX_CONTENT_CHARS = 50000;
const MAX_KEYWORD_CHARS = 200;

// Module-level lazy singleton for GoogleGenAI client
let aiClientInstance: GoogleGenAI | null = null;
const getAIClient = (): GoogleGenAI => {
  if (!aiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClientInstance;
};

// SEO Audit Schema Definition
const auditResponseSchema = {
  type: Type.OBJECT,
  properties: {
    overall_score: {
      type: Type.INTEGER,
      description: 'Overall SEO score from 0 to 100 based on keyword targeting, content depth, readability, and structural health.',
    },
    verdict: {
      type: Type.STRING,
      description: 'A crisp, one-line verdict evaluating the page status.',
    },
    score_breakdown: {
      type: Type.OBJECT,
      properties: {
        content_depth: { type: Type.INTEGER, description: 'Score 0-100 for topical completeness and length' },
        readability: { type: Type.INTEGER, description: 'Score 0-100 for sentence cadence, simplicity, and tone' },
        keyword_optimization: { type: Type.INTEGER, description: 'Score 0-100 for keyword density and natural placement' },
        heading_structure: { type: Type.INTEGER, description: 'Score 0-100 for H1 clarity and logical heading order' },
      },
      required: ['content_depth', 'readability', 'keyword_optimization', 'heading_structure'],
      description: 'Four calibrated category sub-scores from 0 to 100.',
    },
    title_suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 3 distinct, compelling SEO title tag options under 60 characters each.',
    },
    meta_description_suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 3 persuasive meta description options under 155 characters each with a clear call-to-action.',
    },
    url_slug_suggestion: {
      type: Type.STRING,
      description: 'A clean, keyword-optimized URL slug under 50 characters (e.g., /dentist-in-doha).',
    },
    heading_recommendations: {
      type: Type.OBJECT,
      properties: {
        h1_suggestion: {
          type: Type.STRING,
          description: 'An optimized primary H1 heading containing the target keyword with high click appeal',
        },
        recommended_outline: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING, description: "'H2' or 'H3'" },
              heading: { type: Type.STRING, description: 'Proposed heading text' },
              purpose: { type: Type.STRING, description: 'Why this heading satisfies user intent and topical authority' },
            },
            required: ['level', 'heading', 'purpose'],
          },
          description: 'A 4-6 section recommended heading outline that logically organizes and structures the content.',
        },
      },
      required: ['h1_suggestion', 'recommended_outline'],
      description: 'Optimized H1 and structured outline recommendations.',
    },
    keyword_gaps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          termOrQuestion: { type: Type.STRING, description: 'Related keyword or user question missing from the content' },
          type: { type: Type.STRING, description: "'term' or 'question'" },
          reason: { type: Type.STRING, description: 'One-line reason why covering this helps user intent or rankings' },
        },
        required: ['termOrQuestion', 'type', 'reason'],
      },
      description: 'Important related search terms, topical entities, and questions the page should cover.',
    },
    readability_notes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING, description: 'The exact complex or wordy sentence/passage from the content' },
          rewrite: { type: Type.STRING, description: 'A punchy, clear, simplified rewrite' },
          reason: { type: Type.STRING, description: 'One-line explanation of why the rewrite improves readability' },
        },
        required: ['original', 'rewrite', 'reason'],
      },
      description: 'Exactly 3 specific sentences or paragraphs from the content to simplify, paired with rewrites.',
    },
    fix_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING, description: "'High', 'Medium', or 'Low'" },
          action: { type: Type.STRING, description: 'Specific prioritized task' },
          reason: { type: Type.STRING, description: 'One-line reason for prioritizing this fix' },
        },
        required: ['priority', 'action', 'reason'],
      },
      description: 'Prioritized actionable improvements labeled High, Medium, or Low with one-line reasons.',
    },
  },
  required: [
    'overall_score',
    'verdict',
    'score_breakdown',
    'title_suggestions',
    'meta_description_suggestions',
    'url_slug_suggestion',
    'heading_recommendations',
    'keyword_gaps',
    'readability_notes',
    'fix_list',
  ],
};

/**
 * Determines whether an error qualifies for retry:
 * Only retries on 429 (rate limits), 5xx server/overload errors, or malformed JSON.
 * Specifically rejects retrying 400-class client errors.
 */
const isRetryableError = (err: any): boolean => {
  if (err instanceof SyntaxError) return true;
  const status = Number(err?.status || err?.statusCode || err?.response?.status);

  // 400-class errors (except 429) are invalid requests and should never be retried
  if (status >= 400 && status < 500 && status !== 429) {
    return false;
  }

  // Rate limit
  if (status === 429) return true;
  // Upstream server errors
  if (status >= 500 && status < 600) return true;

  const msg = String(err?.message || '').toLowerCase();
  if (
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('overloaded')
  ) {
    return true;
  }

  if (
    msg.includes('json') ||
    msg.includes('unexpected token') ||
    msg.includes('syntaxerror')
  ) {
    return true;
  }

  return false;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Route: POST /api/audit
 * Performs structured SEO audit with Gemini 3.8 Flash with input sanitization,
 * exponential backoff retry on transient errors, and sanitized error responses.
 */
app.post('/api/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<AuditRequestPayload>;
    const {
      pageContent,
      title = '',
      metaDescription = '',
      targetKeyword = '',
      secondaryKeywords = [],
      pageUrl = '',
      metrics,
    } = body;

    // Validate pageContent
    if (!pageContent || typeof pageContent !== 'string' || !pageContent.trim()) {
      res.status(400).json({ error: 'Page content is required for the audit.' });
      return;
    }

    if (pageContent.length > MAX_CONTENT_CHARS) {
      res.status(413).json({
        error: `Page content exceeds the maximum limit of ${MAX_CONTENT_CHARS.toLocaleString()} characters (provided ${pageContent.length.toLocaleString()} characters). Please shorten or truncate the text.`,
      });
      return;
    }

    // Validate targetKeyword
    if (!targetKeyword || typeof targetKeyword !== 'string' || !targetKeyword.trim()) {
      res.status(400).json({ error: 'A primary target keyword is required.' });
      return;
    }

    if (targetKeyword.length > MAX_KEYWORD_CHARS) {
      res.status(400).json({
        error: `Target keyword exceeds the maximum limit of ${MAX_KEYWORD_CHARS} characters.`,
      });
      return;
    }

    // Sanitize secondaryKeywords to guaranteed string array
    const sanitizedSecondaryKeywords: string[] = Array.isArray(secondaryKeywords)
      ? secondaryKeywords
          .filter((k): k is string => typeof k === 'string')
          .map(k => k.trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    // Sanitize metrics to plain object or default to empty
    const sanitizedMetrics =
      metrics && typeof metrics === 'object' && !Array.isArray(metrics) ? metrics : null;

    const sanitizedTitle = typeof title === 'string' ? title.slice(0, 300) : '';
    const sanitizedMeta =
      typeof metaDescription === 'string' ? metaDescription.slice(0, 500) : '';
    const sanitizedUrl = typeof pageUrl === 'string' ? pageUrl.slice(0, 2048) : '';

    const ai = getAIClient();

    const systemInstruction = `You are a senior technical SEO director and search strategist.
Your task is to analyze the provided web page copy and browser-calculated heuristics against its target keyword and user search intent.
Follow modern Google Search Essentials, helpful content criteria, and on-page optimization best practices:
1. Ensure all title suggestions are compelling, click-worthy, contain the target keyword, and are STRICTLY under 60 characters.
2. Ensure meta descriptions include a clear value proposition, call-to-action, and are STRICTLY under 155 characters.
3. Suggest an SEO-friendly URL slug (e.g. /dentist-in-doha) under 50 characters.
4. Recommend an optimized H1 and a logical H2/H3 outline that comprehensively covers search intent.
5. Provide a realistic score_breakdown (0-100) across content depth, readability, keyword optimization, and heading structure.
6. Identify real semantic keyword gaps and user search questions not answered on the page.
7. Provide exactly 3 specific dense or wordy sentences from the text with simplified, punchy rewrites.
8. Prioritize actionable fixes into High, Medium, and Low with one-line rationale.
Output must be strictly valid JSON conforming exactly to the response schema.`;

    const promptText = `Please audit this web page content:
Target Keyword: "${targetKeyword.trim()}"
Secondary Keywords: ${sanitizedSecondaryKeywords.length ? sanitizedSecondaryKeywords.join(', ') : 'None'}
Page URL: ${sanitizedUrl || 'None specified'}
Existing Page Title: "${sanitizedTitle || '(None provided)'}"
Existing Meta Description: "${sanitizedMeta || '(None provided)'}"

Pre-calculated Browser On-Page Metrics:
- Word Count: ${sanitizedMetrics?.wordCount ?? 'Unknown'} ${sanitizedMetrics?.thinContentWarning ? '(WARNING: Content is thin under 100 words)' : ''}
- Sentences: ${sanitizedMetrics?.sentenceCount ?? 'Unknown'}
- Average Sentence Length: ${sanitizedMetrics?.avgSentenceLength ?? 'Unknown'} words/sentence
- Flesch Reading Ease: ${sanitizedMetrics?.fleschScore ?? 'Unknown'} (${sanitizedMetrics?.fleschLabel ?? 'Unknown'})
- Keyword Count: ${sanitizedMetrics?.keywordCount ?? '0'} times (Density: ${sanitizedMetrics?.keywordDensity ?? '0'}%)
- In Title: ${sanitizedMetrics?.inTitle ? 'Yes' : 'No'}
- In First 100 Words: ${sanitizedMetrics?.inFirst100 ? 'Yes' : 'No'}
- In Headings: ${sanitizedMetrics?.inHeadings ? 'Yes' : 'No'}
- H1 Count: ${sanitizedMetrics?.h1Count ?? 0} (Logical Hierarchy: ${sanitizedMetrics?.headingsLogicalOrder ? 'Yes' : 'No'})
${sanitizedMetrics?.headingIssues?.length ? `Heading Issues: ${sanitizedMetrics.headingIssues.join('; ')}` : ''}

Page Text Content:
"""
${pageContent}
"""

Instructions:
1. Calculate a fair overall_score (0-100) and calibrated score_breakdown (content_depth, readability, keyword_optimization, heading_structure). If content is thin (<100 words), penalize accordingly.
2. Provide a crisp one-line verdict.
3. Provide 3 high-converting title suggestions STRICTLY under 60 characters containing the target keyword.
4. Provide 3 compelling meta descriptions STRICTLY under 155 characters with a clear call-to-action.
5. Provide an SEO-friendly URL slug (e.g. /dentist-in-doha).
6. Provide heading_recommendations: an optimized primary H1 suggestion and a recommended 4-6 section outline of H2/H3 subheadings for search intent coverage.
7. Identify semantic keyword gaps and user search questions not answered on the page.
8. Pick 3 specific dense or awkward sentences from the provided text and provide clearer rewrites with reasons.
9. Provide a prioritized fix_list with High, Medium, and Low actions with one-line reasons.`;

    // Exponential backoff delays: 500ms then 1500ms (max 2 retries, 3 total attempts)
    const backoffDelays = [500, 1500];
    let result: any = null;
    let lastError: any = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: promptText,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: auditResponseSchema,
            temperature: 0.2,
          },
        });

        const text = response.text?.trim() || '';
        result = JSON.parse(text);
        break; // Successfully generated and parsed
      } catch (err: any) {
        lastError = err;
        console.error(`Gemini audit attempt ${attempt + 1} failed:`, err);

        // Only retry if error is transient and attempts remain
        if (attempt < 2 && isRetryableError(err)) {
          const delay = backoffDelays[attempt];
          console.warn(`Retrying Gemini audit call in ${delay}ms...`);
          await wait(delay);
        } else {
          break;
        }
      }
    }

    if (!result) {
      const status = Number(
        lastError?.status || lastError?.statusCode || lastError?.response?.status
      );
      const errMsg = String(lastError?.message || '').toLowerCase();

      if (
        status === 429 ||
        errMsg.includes('rate limit') ||
        errMsg.includes('quota') ||
        errMsg.includes('resource_exhausted')
      ) {
        res.status(429).json({
          error: 'API rate limit reached. Please wait a moment and try again.',
        });
        return;
      }

      if (
        lastError instanceof SyntaxError ||
        errMsg.includes('json') ||
        errMsg.includes('parse')
      ) {
        res.status(502).json({
          error: 'The AI model response could not be formatted properly. Please try running the audit again.',
        });
        return;
      }

      res.status(500).json({
        error: 'The audit failed. Please try again.',
      });
      return;
    }

    res.json({ success: true, audit: result });
  } catch (error: any) {
    console.error('Audit API uncaught error:', error);

    const status = Number(error?.status || error?.statusCode || error?.response?.status);
    const errMsg = String(error?.message || '').toLowerCase();

    if (status === 429 || errMsg.includes('rate limit') || errMsg.includes('quota')) {
      res.status(429).json({
        error: 'API rate limit reached. Please wait a moment and try again.',
      });
      return;
    }

    // Always return safe sanitized message without leaking internal trace
    res.status(500).json({
      error: 'The audit failed. Please try again.',
    });
  }
});

/**
 * Route: POST /api/fetch-url
 * Validates URL format with new URL() (http/https only),
 * then uses Gemini's urlContext tool to read the web page.
 */
app.post('/api/fetch-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Valid URL is required.' });
      return;
    }

    const trimmedUrl = url.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      res.status(400).json({
        error: 'Invalid URL. Please provide a valid web address starting with http:// or https://.',
      });
      return;
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      res.status(400).json({
        error: 'Invalid URL protocol. Only http:// and https:// URLs are supported.',
      });
      return;
    }

    const ai = getAIClient();

    const prompt = `Use the urlContext tool to read and extract the main content from the web page at: ${parsedUrl.toString()}
Extract the following information:
1. The page title (if visible in HTML title tag or primary header)
2. The meta description (if declared in meta tag or initial introductory text)
3. The main text content of the page including headings (use # for H1, ## for H2, etc.) and body paragraphs. Exclude repetitive navigation menus and footer copyright links.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ urlContext: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Page title' },
            metaDescription: { type: Type.STRING, description: 'Meta description if found or empty string' },
            content: { type: Type.STRING, description: 'Main text content with markdown headings' },
          },
          required: ['content'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    if (!parsed.content || parsed.content.length < 20) {
      res.status(422).json({
        error: 'Could not read page from this URL. Please paste the page content directly into the text area.',
      });
      return;
    }

    res.json({
      success: true,
      title: parsed.title || '',
      metaDescription: parsed.metaDescription || '',
      content: parsed.content || '',
    });
  } catch (err: any) {
    console.error('Fetch URL error:', err);
    res.status(422).json({
      error: 'Could not read page from this URL. Please paste the page content directly into the text area.',
    });
  }
});

// Setup dev server or static production files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Page Auditor server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
