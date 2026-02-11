import { NextResponse } from "next/server";
import { PdfSchema } from "@/lib/validators";
import { marked } from "marked";
import fs from "fs";
import path from "path";

import puppeteer from "puppeteer-core";
import type { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function fileToDataUri(absPath: string, mime: string) {
  const b = fs.readFileSync(absPath);
  return `data:${mime};base64,${b.toString("base64")}`;
}

function logoDataUri() {
  try {
    const p = path.join(process.cwd(), "public", "logo.jpeg");
    return fileToDataUri(p, "image/jpeg");
  } catch {
    return "";
  }
}

function fontDataUri(filename: string) {
  try {
    const p = path.join(process.cwd(), "public", "fonts", filename);
    // ttf
    return fileToDataUri(p, "font/ttf");
  } catch {
    return "";
  }
}

function toHtml(lang: "en" | "ar", md: string) {
  const content = marked.parse(md);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "right" : "left";

  const logo = logoDataUri();

  // ✅ Embed Arabic font (fix for Vercel/Chromium-min)
  const arRegular = fontDataUri("NotoNaskhArabic-Regular.ttf");
  const arBold = fontDataUri("NotoNaskhArabic-Bold.ttf");
  const hasArabicFont = Boolean(arRegular);

  const fontCss =
    lang === "ar" && hasArabicFont
      ? `
@font-face{
  font-family:"BeamArabic";
  src:url("${arRegular}") format("truetype");
  font-weight:400;
  font-style:normal;
}
${arBold ? `@font-face{
  font-family:"BeamArabic";
  src:url("${arBold}") format("truetype");
  font-weight:700;
  font-style:normal;
}` : ""}
`
      : "";

  const bodyFont =
    lang === "ar" && hasArabicFont
      ? `"BeamArabic", Tahoma, Arial, sans-serif`
      : `Arial, Tahoma, sans-serif`;

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Proposal</title>
<style>
  ${fontCss}

  *{ box-sizing:border-box; }
  html,body{ -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  body{
    font-family: ${bodyFont};
    margin: 32px;
    color:#0b1220;
    line-height:1.55;
  }

  .header{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:16px;
    margin-bottom:24px;
  }
  .brand{ display:flex; align-items:center; gap:12px; }
  .brand img{ width:52px; height:52px; border-radius:10px; object-fit:cover; }
  .brand .t1{ font-weight:800; font-size:14px; }
  .brand .t2{ font-weight:900; font-size:18px; color:#0b5bd3; }

  /* ✅ force direction + alignment for all generated markdown nodes */
  .doc{
    direction:${dir};
    text-align:${align};
    unicode-bidi:isolate;
  }
  .doc *{
    direction:${dir};
    text-align:${align};
  }

  h1,h2,h3{ margin: 18px 0 8px; }
  p{ margin: 8px 0; }

  ul,ol{ padding-${align === "right" ? "right" : "left"}: 20px; margin: 8px 0; }
  li{ margin: 6px 0; }

  table{ width:100%; border-collapse:collapse; margin: 12px 0; }
  th,td{ border:1px solid #ddd; padding:8px; font-size:12px; vertical-align:top; }
  th{ background:#f5f7fb; font-weight:800; }

  code{ background:#f5f7fb; padding:2px 4px; border-radius:6px; }

  blockquote{
    border-${align === "right" ? "right" : "left"}:4px solid #0b5bd3;
    margin:12px 0;
    padding:8px 12px;
    background:#f5f7fb;
  }
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
    <div style="font-size:12px;color:#4b5563">
      ${lang === "ar" ? "عرض فني" : "Technical Proposal"}
    </div>
  </div>

  <div class="doc">
    ${content}
  </div>
</body>
</html>`;
}

export async function POST(req: Request) {
  let browser: Browser | null = null;

  try {
    const parsed = PdfSchema.parse(await req.json());
    const html = toHtml(parsed.lang, parsed.proposalMarkdown);

    const packUrl = process.env.CHROMIUM_PACK_URL;
    if (!packUrl) throw new Error("CHROMIUM_PACK_URL_missing");

    const executablePath = await chromium.executablePath(packUrl);

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // ✅ don't rely on networkidle for embedded fonts
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // ✅ wait until fonts are ready (important for Arabic)
    await page.evaluate(() => (document as any).fonts?.ready);

    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "14mm", left: "12mm", right: "12mm" },
    });

    await page.close();
    await browser.close();
    browser = null;

    return new NextResponse(Buffer.from(pdfUint8), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="proposal-${parsed.lang}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    console.error("/api/proposal/pdf error:", e);
    return NextResponse.json(
      { error: e?.message || "pdf_failed" },
      { status: 500 }
    );
  }
}
