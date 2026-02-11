import { NextResponse } from "next/server";
import { PdfSchema } from "@/lib/validators";
import { marked } from "marked";
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function logoDataUri() {
  try {
    const p = path.join(process.cwd(), "public", "logo.jpeg");
    const b = fs.readFileSync(p);
    const base64 = b.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return "";
  }
}

function toHtml(lang: "en" | "ar", md: string) {
  const content = marked.parse(md);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "right" : "left";
  const logo = logoDataUri();

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Proposal</title>
<style>
  body{ font-family: Arial, "Noto Naskh Arabic", "Noto Sans Arabic", Tahoma, sans-serif; margin: 32px; color:#0b1220; line-height:1.45; }
  .header{ display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:24px; }
  .brand{ display:flex; align-items:center; gap:12px; }
  .brand img{ width:52px; height:52px; border-radius:10px; object-fit:cover; }
  .brand .t1{ font-weight:800; font-size:14px; }
  .brand .t2{ font-weight:900; font-size:18px; color:#0b5bd3; }
  .doc{ direction:${dir}; text-align:${align}; unicode-bidi: plaintext; }
  h1,h2,h3{ margin: 18px 0 8px; }
  table{ width:100%; border-collapse:collapse; margin: 12px 0; }
  th,td{ border:1px solid #ddd; padding:8px; font-size:12px; vertical-align:top; }
  th{ background:#f5f7fb; font-weight:800; }
  code{ background:#f5f7fb; padding:2px 4px; border-radius:6px; }
  blockquote{ border-${align === "right" ? "right" : "left"}:4px solid #0b5bd3; margin:12px 0; padding:8px 12px; background:#f5f7fb; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      ${logo ? `<img src="${logo}" alt="Logo" />` : ""}
      <div>
        <div class="t1">Beam Of</div>
        <div class="t2">Technology</div>
      </div>
    </div>
    <div style="font-size:12px;color:#4b5563">${lang === "ar" ? "عرض فني" : "Technical Proposal"}</div>
  </div>

  <div class="doc">
    ${content}
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  let browser: any = null;

  try {
    const body = await req.json();
    const parsed = PdfSchema.parse(body);

    const html = toHtml(parsed.lang, parsed.proposalMarkdown);

    const executablePath = await chromium.executablePath();

    browser = await puppeteer.launch({
      args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: executablePath || undefined,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });

    const buf = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposal-${parsed.lang}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("/api/proposal/pdf error:", e);
    return NextResponse.json({ error: e?.message || "pdf_failed" }, { status: 500 });
  } finally {
    try {
      await browser?.close();
    } catch {}
  }
}
