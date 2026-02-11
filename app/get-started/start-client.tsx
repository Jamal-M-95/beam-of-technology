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

export default function GetStartedClient() {
  // UI language only (never auto-switch on upload)
  const { lang } = useLang();

  // Content language used for chat/proposal generation (can differ from UI lang)
  const [contentLang, setContentLang] = useState<Lang>(lang);

  const [rfpText, setRfpText] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [proposal, setProposal] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isRtl = contentLang === 'ar';
  const dir: 'rtl' | 'ltr' = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    // Keep contentLang in sync with UI only when there is no loaded RFP.
    if (!rfpText.trim()) setContentLang(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    // Welcome message (always first) - depends on UI language
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
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/rfp/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'extract_failed');

      const extracted = (data.text || '') as string;
      setRfpText(extracted);

      // Detect content language WITHOUT changing the whole UI language.
      if (data?.detectedLang === 'ar') setContentLang('ar');
      else if (data?.detectedLang === 'en') setContentLang('en');

      // Optional: if user uploads a file, clear previous proposal
      setProposal('');
      localStorage.removeItem('last_proposal');
      localStorage.removeItem('last_proposal_lang');
    } catch (e: any) {
      setRfpText(
        lang === 'ar'
          ? `تعذر استخراج النص من الملف. الصق النص يدويًا.\n\nالملف: ${file.name}`
          : `Could not extract text from the file. Please paste the text manually.\n\nFile: ${file.name}`
      );
    } finally {
      setIsExtracting(false);
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
        content: (data.reply ?? '...') as string,
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
      const md = (data.proposalMarkdown as string) || '';
      setProposal(md);

      // For /print fallback
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
      // Fallback for Arabic or if puppeteer fails
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
                {lang === 'ar' ? 'جاري استخراج النص...' : 'Extracting text...'}
              </div>
            ) : null}

            <label className="block text-sm font-bold text-white/90">{t(lang, 'rfp_paste')}</label>

            {/* ✅ FIX: Direction + unicode-bidi so Arabic (RTL) displays correctly */}
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
                (canGenerate && !isGenerating
                  ? 'bg-blue-600/80 hover:bg-blue-600'
                  : 'cursor-not-allowed bg-white/10')
              }
            >
              {isGenerating ? (lang === 'ar' ? 'جاري الإنشاء...' : 'Generating...') : t(lang, 'generate_btn')}
            </button>

            {/* Small hint about detected content language */}
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
                <div
                  key={idx}
                  className={'mb-3 flex ' + (m.role === 'user' ? 'justify-end' : 'justify-start')}
                >
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
              <div className="text-lg font-extrabold">
                {lang === 'ar' ? 'العرض الفني' : 'Technical Proposal'}
              </div>
              <div className="text-sm text-white/70">{t(lang, 'proposal_ready')}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={!proposal}
                onClick={() =>
                  document.getElementById('proposal_preview')?.scrollIntoView({ behavior: 'smooth' })
                }
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
