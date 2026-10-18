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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = Number(process.env.PORT) || 3000;

// Initialize Google GenAI client with required header
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
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
    'title_suggestions',
    'meta_description_suggestions',
    'keyword_gaps',
    'readability_notes',
    'fix_list',
  ],
};

/**
 * Route: POST /api/audit
 * Performs structured SEO audit with Gemini 3.8 Flash, with automatic single retry on invalid JSON
 */
app.post('/api/audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      pageContent,
      title = '',
      metaDescription = '',
      targetKeyword = '',
      secondaryKeywords = [],
      pageUrl = '',
      metrics,
    } = req.body;

    if (!pageContent || typeof pageContent !== 'string' || !pageContent.trim()) {
      res.status(400).json({ error: 'Page content is required for the audit.' });
      return;
    }

    if (!targetKeyword || typeof targetKeyword !== 'string' || !targetKeyword.trim()) {
      res.status(400).json({ error: 'A primary target keyword is required.' });
      return;
    }

    const ai = getAIClient();

    const systemInstruction = `You are a senior technical SEO consultant and content strategist.
Your task is to analyze a web page's text and pre-calculated heuristics against its target keyword and search intent.
Provide a rigorous, unbiased, professional audit in strict JSON adhering to the provided schema.
Ensure title suggestions are STRICTLY under 60 characters.
Ensure meta description suggestions are STRICTLY under 155 characters.
Provide exactly 3 specific sentences from the text with simplified rewrites.
Prioritize fixes logically into High, Medium, and Low.`;

    const promptText = `Please audit this web page content:
Target Keyword: "${targetKeyword}"
Secondary Keywords: ${secondaryKeywords.length ? secondaryKeywords.join(', ') : 'None'}
Page URL: ${pageUrl || 'None specified'}
Existing Page Title: "${title || '(None provided)'}"
Existing Meta Description: "${metaDescription || '(None provided)'}"

Pre-calculated Browser On-Page Metrics:
- Word Count: ${metrics?.wordCount ?? 'Unknown'} ${metrics?.thinContentWarning ? '(WARNING: Content is thin under 100 words)' : ''}
- Sentences: ${metrics?.sentenceCount ?? 'Unknown'}
- Average Sentence Length: ${metrics?.avgSentenceLength ?? 'Unknown'} words/sentence
- Flesch Reading Ease: ${metrics?.fleschScore ?? 'Unknown'} (${metrics?.fleschLabel ?? 'Unknown'})
- Keyword Count: ${metrics?.keywordCount ?? '0'} times (Density: ${metrics?.keywordDensity ?? '0'}%)
- In Title: ${metrics?.inTitle ? 'Yes' : 'No'}
- In First 100 Words: ${metrics?.inFirst100 ? 'Yes' : 'No'}
- In Headings: ${metrics?.inHeadings ? 'Yes' : 'No'}
- H1 Count: ${metrics?.h1Count ?? 0} (Logical Hierarchy: ${metrics?.headingsLogicalOrder ? 'Yes' : 'No'})
${metrics?.headingIssues?.length ? `Heading Issues: ${metrics.headingIssues.join('; ')}` : ''}

Page Text Content:
"""
${pageContent}
"""

Instructions:
1. Calculate a fair overall_score (0-100) reflecting on-page optimization, content depth, readability, and intent match. If content is thin (<100 words), penalize accordingly.
2. Provide a crisp one-line verdict.
3. Provide 3 high-converting title suggestions STRICTLY under 60 characters containing the target keyword.
4. Provide 3 compelling meta descriptions STRICTLY under 155 characters with a clear call-to-action.
5. Identify semantic keyword gaps and user questions not answered on the page.
6. Pick 3 specific dense or awkward sentences from the provided text and provide clearer rewrites with reasons.
7. Provide a prioritized fix_list with High, Medium, and Low actions with one-line reasons.`;

    // Attempt Gemini call with single retry logic for robust JSON extraction
    const executeCall = async () => {
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
      return JSON.parse(text);
    };

    let result;
    try {
      result = await executeCall();
    } catch (firstErr) {
      console.warn('First Gemini audit call failed, retrying once...', firstErr);
      try {
        result = await executeCall();
      } catch (retryErr) {
        console.error('Gemini audit retry failed:', retryErr);
        res.status(502).json({
          error: 'The AI model response could not be formatted properly. Please try running the audit again.',
        });
        return;
      }
    }

    res.json({ success: true, audit: result });
  } catch (error: any) {
    console.error('Audit API error:', error);
    res.status(500).json({
      error: error?.message || 'An unexpected error occurred while analyzing the page.',
    });
  }
});

/**
 * Route: POST /api/fetch-url
 * Uses Gemini's urlContext tool to read the web page.
 * If fetching fails, returns a clear instruction to paste content instead.
 */
app.post('/api/fetch-url', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Valid URL is required.' });
      return;
    }

    const ai = getAIClient();

    const prompt = `Use the urlContext tool to read and extract the main content from the web page at: ${url.trim()}
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
