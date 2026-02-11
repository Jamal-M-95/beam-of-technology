# Beam Of Technology — AI Proposal Generator (Next.js + Groq)

This project is a bilingual (Arabic/English) website that generates full technical proposals based on an RFP/SOW.

## Features
- Pages: Home / About / Services / Contact Us
- Get Started:
  - Upload RFP (PDF/TXT) or paste text
  - Chat with AI about requirements
  - Generate a full Technical Proposal (Markdown)
  - Preview, Generate Again (based on first), Download PDF (with company logo)

## Setup
1) Install dependencies:
```bash
npm install
```

2) Create env file:
```bash
cp .env.example .env.local
```
Set `GROQ_API_KEY`.

3) Run:
```bash
npm run dev
```
Open: http://localhost:3000

## Notes
- PDF generation uses Puppeteer to render the proposal and export it as PDF (best for Arabic text).
- If PDF generation fails on your machine, the UI automatically falls back to `/print` where you can "Print / Save PDF".

## Optional OpenAI
There is a commented OpenAI client in `lib/groq.ts`. If you want to switch:
- `npm i openai`
- Set `OPENAI_API_KEY`
- Update the API routes to use OpenAI instead of Groq.
