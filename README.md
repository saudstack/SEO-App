# Page Auditor — On-Page SEO & Content Strategy Tool

**Page Auditor** is a full-stack, single-page web application that delivers structured, actionable on-page SEO audits. It pairs instant, client-side deterministic heuristics (reading ease, keyword density, heading hierarchy) with Google Gemini AI to analyze search intent, generate optimized metadata, identify semantic keyword gaps, rewrite dense passages, and outline content structure.

---

## What the App Does

Page Auditor evaluates any web page's content against a primary target keyword and optional secondary keywords:

1. **Instant Browser Diagnostics (Pre-Audit Heuristics)**:
   - **Word & Sentence Counts**: Analyzes content volume and warns if thin content (<100 words) could trigger ranking penalties.
   - **Flesch Reading Ease**: Computes phonetic syllable counts to evaluate sentence cadence with plain-English labels (*Easy to read*, *Standard*, *Difficult*).
   - **Keyword Presence & Density**: Checks keyword frequency, percentage density, and verifies placement in the page title, first 100 words, and headings.
   - **Heading Hierarchy Check**: Validates that exactly one H1 tag exists and verifies headings follow a logical order without skipping levels (e.g. H1 to H3).

2. **AI-Powered Structured SEO Insights (Gemini 3.8 Flash)**:
   - **Overall Score & 4-Pillar Breakdown**: Delivers an overall SEO score (0–100) with a one-line verdict and sub-scores for *Content Depth*, *Readability*, *Keyword Optimization*, and *Heading Structure*.
   - **SEO Title Suggestions**: 3 click-worthy title options strictly under 60 characters with live character counters.
   - **Meta Description Suggestions**: 3 persuasive meta descriptions strictly under 155 characters with clear calls-to-action.
   - **Interactive Google SERP Preview**: Desktop and Mobile preview of your title, URL slug, and meta description on Google search results, with one-click **Copy HTML Meta Tags**.
   - **Headings & Outline Recommendations**: Recommends an optimized primary H1 tag and a structured 4–6 section H2/H3 outline satisfying user search journey intent.
   - **Keyword Gaps & Intent Opportunities**: Highlights missing topical entities and real user questions not yet answered on the page, filterable by type.
   - **Readability Improvements**: Identifies specific dense or passive sentences from the copy and provides clear, simplified rewrites.
   - **Prioritized Action Plan**: Ranked roadmap items labeled **High**, **Medium**, or **Low** with specific impact reasons.

3. **Head-to-Head Competitor Comparison**:
   - **URL Fetch & Live Crawl**: Input any competing ranking URL to extract their live headings, title, meta description, and content for real-time benchmarking.
   - **Sample Competitor Instant Load**: Test the benchmarking flow with one click using the pre-configured *Al Meezan Dental* competitor benchmark.
   - **Side-by-Side Metric Contrast**: Contrasts word count, Flesch reading score, average sentence length, keyword density, on-page keyword placement (title, intro 100 words, headings), and heading hierarchy.
   - **Visual Advantage & Win Badges**: Instant scoreboard highlights which page holds the edge across each category (You Lead, Competitor Lead, or Tied).
   - **Snippet & Outline Comparison**: Compare your title/meta tags and heading outlines side-by-side with your competitor.
   - **Actionable Outranking Takeaways**: Generates prioritized strategies to outrank the specific competitor based on identified gaps.
   - **Export Comparison**: Copy the full head-to-head Markdown comparison table to clipboard.

4. **Interactive SEO Checklist (Session-Persisted)**:
   - **Live Progress Tracking**: Interactive checkboxes to mark off tasks as fixes are made to your website, complete with progress percentage and milestone celebration banner.
   - **Session Persistence**: Checked states persist automatically in `sessionStorage` throughout your session, surviving page refreshes and tab switching.
   - **Custom Tasks**: Add custom webmaster action items (e.g. submit XML sitemap, update canonical tag, add internal links) with customizable priority badges.
   - **Quick Filters & State Controls**: Filter by All, Pending, or Completed tasks; one-click "Mark All Complete", "Clear All", or "Reset to Audit".
   - **Export Checklist Status**: Copy the live checklist state with progress stats as formatted Markdown (`- [x]` / `- [ ]`) for GitHub, Jira, Linear, or Notion.

4. **Copy & Export Utilities**:
   - **One-Click Copy**: Copy individual titles, meta descriptions, HTML tags, recommended H1, heading outline as Markdown, keyword lists (CSV or bulleted), readability rewrites, and action tasks.
   - **Copy as Checklist**: Exports the prioritized action plan formatted as Markdown checkboxes (`- [ ] [HIGH] ...`) ready for Jira, Linear, Notion, or GitHub issues.
   - **Download Markdown Report (`.md`)**: Full, publication-ready audit report.
   - **Download JSON Report (`.json`)**: Raw structured data for automated SEO pipelines.

---

## Screenshots

<!-- SCREENSHOTS PLACEHOLDER START -->
### Audit Input & Heuristic Diagnostics
![Page Auditor Input & Heuristics](https://placehold.co/1200x630/1e293b/ffffff?text=Page+Auditor+Input+Form+%26+Live+Diagnostics)
*Paste page content, configure target keyword, or fetch directly from URL with live pre-audit chips.*

### Comprehensive SEO Audit Report & SERP Preview
![Page Auditor Results & SERP Preview](https://placehold.co/1200x630/4338ca/ffffff?text=Page+Auditor+Score+Gauge%2C+SERP+Preview+%26+Outline)
*Score gauge, 4-pillar breakdown, title & meta suggestions, interactive Google SERP simulator, and heading recommendations.*
<!-- SCREENSHOTS PLACEHOLDER END -->

---

## Required Environment Variables

Configure your environment variables in a `.env` file in the project root. Match the format defined in `.env.example`:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Required.** Google Gemini API key used for generating structured SEO audits and analyzing search intent. | `"AIzaSy..."` |
| `APP_URL` | **Required.** The hosted URL of this applet (injected automatically in AI Studio / Cloud Run). | `"https://my-app.run.app"` |
| `PORT` | Optional. Local port for the Express full-stack server. | `3000` |

---

## Setup Steps

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20+ recommended)
- `npm` (version 9+)

### Installation
1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd page-auditor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Open `.env` and set your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   APP_URL="http://localhost:3000"
   ```

---

## How to Run Locally

Start the full-stack development server:
```bash
npm run dev
```

- The app will be running at [http://localhost:3000](http://localhost:3000).
- Express serves API routes (`/api/audit`, `/api/fetch-url`) with Vite running as middleware in development.

### Useful Commands
- `npm run lint` — Runs TypeScript compiler checks (`tsc --noEmit`).
- `npm run build` — Compiles the production frontend bundle into `dist/`.
- `npm run clean` — Removes the `dist/` directory.

---

## How to Deploy

### 1. Production Build
Build the client-side bundle:
```bash
npm run build
```

### 2. Start Production Server
Launch the Node/Express server:
```bash
npm start
```
In production mode (`NODE_ENV=production`), Express statically serves the pre-compiled assets from `dist/` and proxies SPA routing back to `dist/index.html`.

### 3. Container / Cloud Run Deployment
To containerize for Google Cloud Run or Docker:
```dockerfile
FROM node:22-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN npm install -g tsx

EXPOSE 3000
CMD ["tsx", "server.ts"]
```

Ensure `GEMINI_API_KEY` and `APP_URL` are provided as environment variables in your deployment environment.
