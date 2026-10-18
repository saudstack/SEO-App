# Page Auditor

A small SEO audit tool. Paste a web page's content and a target keyword, and get title and meta description suggestions, keyword gaps, readability notes and a prioritised fix list.

Built with Google AI Studio and the Gemini API, then iterated by prompting and editing by hand.

## What it does
- Calculates word count, reading ease and keyword density in the browser
- Sends the page text and metrics to Gemini for a structured audit
- Shows results as cards, with a downloadable report

## Stack
Google AI Studio (Build mode), Gemini API, TypeScript, Vite

## Run it locally
1. Clone the repo and run `npm install`
2. Copy `.env.example` to `.env` and add your own Gemini API key
3. Run `npm run dev`

## What broke
- (Write 2 or 3 real problems you hit, for example: URL fetching failed, the score was wrong, JSON output was invalid.)

## What I changed by hand
- (Write one or two real changes you made yourself.)

## What I'd improve next
- (One or two honest ideas.)
