'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useLang } from '@/components/LanguageProvider';
import { t } from '@/lib/i18n';

type Lang = 'en' | 'ar';
type ChatMsg = { role: 'user' | 'assistant'; content: string };

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="text-lg font-extrabold">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProposalPreview({
  markdown,
  dir,
  lang,
}: {
  markdown: string;
  dir: 'rtl' | 'ltr';
  lang: string;
}) {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-black/20 p-6"
      dir={dir}
      lang={lang}
      style={{ unicodeBidi: 'plaintext' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        className="max-w-none text-sm leading-relaxed text-white/90"
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

/** ---------- Helpers ---------- */

function isMostlyArabic(s: string) {
  const ar = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const total = (s.match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
  return total > 0 && ar / total > 0.25;
}

function cleanText(s: string) {
  return s
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Heuristic: Arabic PDF extraction sometimes comes out with almost no spaces
 * and long continuous Arabic runs (visual order / broken spacing).
 */
function looksBrokenArabicPdf(text: string) {
  const t = text || '';
  if (t.length < 80) return true;
  if (!isMostlyArabic(t)) return false;

  const spaces = (t.match(/[ \t]/g) || []).length;
  const ratio = spaces / Math.max(1, t.length);

  // too few spaces for long Arabic content → usually broken
  if (ratio < 0.01) return true;

  // very long continuous Arabic sequences
  const longRun = /[\u0600-\u06FF]{25,}/.test(t);
  return longRun;
}

type PdfItem = { str: string; x: number; y: number; w: number };

/**
 * PDF text extraction in the browser using pdfjs-dist (better RTL than server pdf-parse).
 */
async function extractPdfTextClient(file: File, onStatus?: (s: string) => void) {
  onStatus?.('Loading PDF engine...');

  // pdfjs-dist@4.x (ESM)
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Set worker (works with Next bundling)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const data = new Uint8Array(await file.arrayBuffer());

  onStatus?.('Reading PDF pages...');
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  const numPages: number = pdf.numPages;
  let full = '';

  for (let p = 1; p <= numPages; p++) {
    onStatus?.(`Extracting text… page ${p}/${numPages}`);

    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();

    const items: PdfItem[] = (tc.items || [])
      .filter((it: any) => typeof it?.str === 'string' && String(it.str).trim() !== '')
      .map((it: any) => ({
        str: String(it.str),
        x: Number(it.transform?.[4] ?? 0),
        y: Number(it.transform?.[5] ?? 0),
        w: Number(it.width ?? 0),
      }));

    const rtlLine = items.length ? isMostlyArabic(items.map((i: PdfItem) => i.str).join(' ')) : false;

    const bucketY = (y: number) => Math.round(y * 2) / 2; // 0.5 buckets
    const lines = new Map<number, PdfItem[]>();

    for (const it of items) {
      const y = bucketY(it.y);
      const arr = lines.get(y) || [];
      arr.push(it);
      lines.set(y, arr);
    }

    const ys = Array.from(lines.keys()).sort((a: number, b: number) => b - a); // top -> bottom
    const pageLines: string[] = [];

    for (const y of ys) {
      const lineItems = lines.get(y)!;

      lineItems.sort((a: PdfItem, b: PdfItem) => (rtlLine ? b.x - a.x : a.x - b.x));

      let line = '';
      let prev: { x: number; w: number } | null = null;

      for (const it of lineItems) {
        if (prev) {
          const gap = rtlLine ? prev.x - (it.x + it.w) : it.x - (prev.x + prev.w);
          if (gap > 2) line += ' ';
        }
        line += it.str;
        prev = { x: it.x, w: it.w };
      }

      pageLines.push(line);
    }

    full += pageLines.join('\n') + '\n\n';
  }

  return cleanText(full);
}

/**
 * OCR fallback (client-side) using pdfjs-dist render -> tesseract.js recognize(canvas)
 * Only used when text extraction is empty/broken.
 */
async function ocrPdfClient(file: File, onStatus?: (s: string) => void) {
  onStatus?.('Preparing OCR...');

  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  // tesseract.js v7: createWorker() then worker.reinitialize('ara')
  const tesseract: any = await import('tesseract.js');
  const createWorker: () => Promise<any> = tesseract.createWorker;

  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;

  // OCR is heavy — limit pages to protect UX
  const MAX_OCR_PAGES = 10;
  const pages = Math.min(Number(pdf.numPages || 1), MAX_OCR_PAGES);

  onStatus?.('Downloading OCR language data (first time may take a bit)...');

  const worker = await createWorker();
  await worker.reinitialize('ara');

  let full = '';

  for (let p = 1; p <= pages; p++) {
    onStatus?.(`OCR… page ${p}/${pages}`);

    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas_context_failed');

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;

    const res = await worker.recognize(canvas);
    full += String(res?.data?.text || '') + '\n\n';
  }

  await worker.terminate();

  return cleanText(full);
}

/** ---------- Component ---------- */

export default function GetStartedClient() {
  const { lang } = useLang();

  const [contentLang, setContentLang] = useState<Lang>(lang);

  const [rfpText, setRfpText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [proposal, setProposal] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isRtl = contentLang === 'ar';
  const dir: 'rtl' | 'ltr' = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!rfpText.trim()) setContentLang(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    setMessages((prev) => {
      const rest = prev.filter((_, i) => i !== 0);

      const welcome: ChatMsg = {
        role: 'assistant',
        content:
          lang === 'ar'
            ? 'مرحبًا! ارفع ملف الـRFP أو الصق النص، ثم اسألني أي شيء قبل إنشاء العرض الفني.'
            : 'Hi! Upload the RFP or paste its text, then ask me anything before generating your proposal.',
      };

      return [welcome, ...rest];
    });
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const canGenerate = useMemo(() => rfpText.trim().length > 20, [rfpText]);

  async function onUpload(file: File | null) {
    if (!file) return;

    setIsExtracting(true);
    setExtractStatus(lang === 'ar' ? 'جاري التحضير...' : 'Preparing...');
    try {
      const name = (file.name || '').toLowerCase();
      const type = (file.type || '').toLowerCase();

      // ✅ PDF: extract in the browser + OCR fallback if broken Arabic
      if (name.endsWith('.pdf') || type === 'application/pdf') {
        let text = await extractPdfTextClient(file, setExtractStatus);

        const detected: Lang = isMostlyArabic(text) ? 'ar' : 'en';

        if (detected === 'ar' && looksBrokenArabicPdf(text)) {
          setExtractStatus(lang === 'ar' ? 'النص العربي ملخبط… جاري OCR' : 'Arabic looks broken… running OCR');
          text = await ocrPdfClient(file, setExtractStatus);
        }

        setRfpText(text);
        setContentLang(isMostlyArabic(text) ? 'ar' : 'en');

        setProposal('');
        localStorage.removeItem('last_proposal');
        localStorage.removeItem('last_proposal_lang');

        return;
      }

      // ✅ Non-PDF: use server extractor
      setExtractStatus(lang === 'ar' ? 'جاري الرفع...' : 'Uploading...');
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/rfp/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'extract_failed');

      const extracted = String(data.text || '');
      setRfpText(extracted);

      if (data?.detectedLang === 'ar') setContentLang('ar');
      else if (data?.detectedLang === 'en') setContentLang('en');

      setProposal('');
      localStorage.removeItem('last_proposal');
      localStorage.removeItem('last_proposal_lang');
    } catch (e: any) {
      setRfpText(
        lang === 'ar'
          ? `تعذر استخراج النص من الملف. الصق النص يدويًا.\n\nالملف: ${file?.name || ''}`
          : `Could not extract text from the file. Please paste the text manually.\n\nFile: ${file?.name || ''}`
      );
    } finally {
      setIsExtracting(false);
      setExtractStatus('');
    }
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');

    const userMsg: ChatMsg = { role: 'user', content: text };
    const next: ChatMsg[] = [...messages, userMsg];

    setMessages(next);

    setIsChatting(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: contentLang, rfpText, messages: next }),
      });

      const data = await res.json();

      const assistantMsg: ChatMsg = {
        role: 'assistant',
        content: String(data.reply ?? '...'),
      };

      setMessages((p) => [...p, assistantMsg]);
    } catch {
      const errMsg: ChatMsg = {
        role: 'assistant',
        content: lang === 'ar' ? 'حصل خطأ في الدردشة.' : 'Chat error.',
      };
      setMessages((p) => [...p, errMsg]);
    } finally {
      setIsChatting(false);
    }
  }

  async function generate(mode: 'fresh' | 'regen') {
    if (!canGenerate) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: contentLang,
          rfpText,
          messages,
          previousProposal: mode === 'regen' ? proposal : undefined,
        }),
      });
      const data = await res.json();
      const md = String((data.proposalMarkdown as string) || '');
      setProposal(md);

      localStorage.setItem('last_proposal', md);
      localStorage.setItem('last_proposal_lang', contentLang);
    } catch {
      alert(lang === 'ar' ? 'فشل إنشاء العرض.' : 'Failed to generate proposal.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function downloadPdf() {
    if (!proposal) return;
    try {
      const res = await fetch('/api/proposal/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: contentLang, proposalMarkdown: proposal }),
      });

      if (!res.ok) throw new Error('pdf');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${contentLang}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open('/print', '_blank');
    }
  }

  async function downloadWord() {
    if (!proposal) return;
    try {
      const res = await fetch('/api/proposal/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: contentLang, proposalMarkdown: proposal }),
      });
      if (!res.ok) throw new Error('docx');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${contentLang}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert(lang === 'ar' ? 'فشل تنزيل ملف Word.' : 'Failed to download Word file.');
    }
  }

  return (
    <div>
      <section className="grid gap-6 md:grid-cols-2">
        <Panel title={t(lang, 'gs_title')}>
          <p className="text-sm text-white/70">{t(lang, 'gs_sub')}</p>

          <div className="mt-5 space-y-3">
            <label className="block text-sm font-bold text-white/90">{t(lang, 'rfp_upload')}</label>
            <input
              type="file"
              accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600/70 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-blue-600"
              onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            />

            {isExtracting ? (
              <div className="text-xs text-white/60">
                {extractStatus || (lang === 'ar' ? 'جاري استخراج النص...' : 'Extracting text...')}
              </div>
            ) : null}

            <label className="block text-sm font-bold text-white/90">{t(lang, 'rfp_paste')}</label>

            <textarea
              value={rfpText}
              onChange={(e) => setRfpText(e.target.value)}
              dir={dir}
              lang={contentLang}
              style={{ unicodeBidi: 'plaintext' }}
              className={
                'h-44 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-blue-500/60 ' +
                (isRtl ? 'text-right' : 'text-left')
              }
              placeholder={lang === 'ar' ? 'الصق نص الـRFP هنا...' : 'Paste the RFP text here...'}
            />

            <button
              disabled={!canGenerate || isGenerating}
              onClick={() => generate('fresh')}
              className={
                'w-full rounded-xl px-4 py-3 text-sm font-extrabold text-white shadow-glow ' +
                (canGenerate && !isGenerating ? 'bg-blue-600/80 hover:bg-blue-600' : 'cursor-not-allowed bg-white/10')
              }
            >
              {isGenerating ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...') : t(lang, 'generate_btn')}
            </button>

            {rfpText.trim() ? (
              <div className="text-xs text-white/50">
                {lang === 'ar'
                  ? `لغة الملف: ${contentLang === 'ar' ? 'عربي' : 'English'}`
                  : `Detected content language: ${contentLang.toUpperCase()}`}
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title={t(lang, 'chat_title')}>
          <div className="glass-lite rounded-2xl p-4">
            <div className="h-64 overflow-auto pr-1">
              {messages.map((m, idx) => (
                <div key={idx} className={'mb-3 flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    dir={dir}
                    style={{ unicodeBidi: 'plaintext' }}
                    className={
                      'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ' +
                      (m.role === 'user'
                        ? 'border border-blue-500/30 bg-blue-600/20 text-white'
                        : 'border border-white/10 bg-black/20 text-white/90')
                    }
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t(lang, 'chat_placeholder')}
                dir={dir}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-blue-500/60"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendChat();
                }}
              />
              <button
                onClick={sendChat}
                disabled={isChatting}
                className="rounded-xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white hover:bg-white/15"
              >
                {isChatting ? '...' : '↵'}
              </button>
            </div>
          </div>
        </Panel>
      </section>

      <section className="mt-8">
        <div className="glass rounded-2xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-extrabold">{lang === 'ar' ? 'العرض الفني' : 'Technical Proposal'}</div>
              <div className="text-sm text-white/70">{t(lang, 'proposal_ready')}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={!proposal}
                onClick={() => document.getElementById('proposal_preview')?.scrollIntoView({ behavior: 'smooth' })}
                className={
                  'rounded-xl px-4 py-2 text-sm font-bold ' +
                  (proposal ? 'bg-white/10 hover:bg-white/15' : 'cursor-not-allowed bg-white/5 text-white/40')
                }
              >
                {t(lang, 'preview')}
              </button>

              <button
                disabled={!proposal || isGenerating}
                onClick={() => generate('regen')}
                className={
                  'rounded-xl px-4 py-2 text-sm font-bold ' +
                  (proposal && !isGenerating
                    ? 'bg-blue-600/70 hover:bg-blue-600'
                    : 'cursor-not-allowed bg-white/5 text-white/40')
                }
              >
                {t(lang, 'regenerate')}
              </button>

              <button
                disabled={!proposal}
                onClick={downloadPdf}
                className={
                  'rounded-xl px-4 py-2 text-sm font-bold ' +
                  (proposal ? 'bg-green-600/70 hover:bg-green-600' : 'cursor-not-allowed bg-white/5 text-white/40')
                }
              >
                {t(lang, 'download_pdf')}
              </button>

              <button
                disabled={!proposal}
                onClick={downloadWord}
                className={
                  'rounded-xl px-4 py-2 text-sm font-bold ' +
                  (proposal ? 'bg-purple-600/70 hover:bg-purple-600' : 'cursor-not-allowed bg-white/5 text-white/40')
                }
              >
                {lang === 'ar' ? 'تنزيل Word' : 'Download Word'}
              </button>
            </div>
          </div>

          <div id="proposal_preview" className="mt-6">
            {proposal ? (
              <ProposalPreview markdown={proposal} dir={dir} lang={contentLang} />
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-sm text-white/60">
                {lang === 'ar'
                  ? 'لم يتم إنشاء عرض بعد. اكتب/الصق الـRFP ثم اضغط إنشاء.'
                  : 'No proposal yet. Paste the RFP then click Generate.'}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
