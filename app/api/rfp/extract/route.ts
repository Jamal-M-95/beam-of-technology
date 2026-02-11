import { NextResponse } from "next/server";
import mammoth from "mammoth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isMostlyArabic(s: string) {
  const ar = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const total = (s.match(/[A-Za-z\u0600-\u06FF]/g) || []).length;
  return total > 0 && ar / total > 0.25;
}

function cleanText(s: string) {
  return s
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function ensurePdfPolyfills() {
  // pdf.js needs DOMMatrix in Node (Vercel serverless)
  if ((globalThis as any).DOMMatrix) return;

  const canvasMod = await import("@napi-rs/canvas");

  // @ts-ignore
  if (!(globalThis as any).DOMMatrix && (canvasMod as any).DOMMatrix) {
    // @ts-ignore
    (globalThis as any).DOMMatrix = (canvasMod as any).DOMMatrix;
  }

  // (optional but helps if pdf.js asks for them)
  // @ts-ignore
  if (!(globalThis as any).ImageData && (canvasMod as any).ImageData) {
    // @ts-ignore
    (globalThis as any).ImageData = (canvasMod as any).ImageData;
  }
  // @ts-ignore
  if (!(globalThis as any).Path2D && (canvasMod as any).Path2D) {
    // @ts-ignore
    (globalThis as any).Path2D = (canvasMod as any).Path2D;
  }
}

async function pdfToText(fileBuffer: Buffer) {
  await ensurePdfPolyfills();

  // ✅ dynamic import AFTER polyfills (so it doesn't crash on import)
  const mod: any = await import("pdf-parse");
  const PDFParseCtor = mod.PDFParse ?? mod.default;
  if (!PDFParseCtor) throw new Error("pdf_parse_export_missing");

  const parser = new PDFParseCtor({ data: fileBuffer });

  try {
    const result = await parser.getText();
    return cleanText(result?.text || "");
  } finally {
    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }
  }
}

async function docxToText(fileBuffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  return cleanText(result.value || "");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();
    const type = (file.type || "").toLowerCase();

    // TXT
    if (name.endsWith(".txt") || type === "text/plain") {
      const text = cleanText(bytes.toString("utf8"));
      return NextResponse.json({
        text,
        detectedLang: isMostlyArabic(text) ? "ar" : "en",
      });
    }

    // PDF
    if (name.endsWith(".pdf") || type === "application/pdf") {
      const text = await pdfToText(bytes);
      return NextResponse.json({
        text,
        detectedLang: isMostlyArabic(text) ? "ar" : "en",
      });
    }

    // DOCX
    if (
      name.endsWith(".docx") ||
      type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const text = await docxToText(bytes);
      return NextResponse.json({
        text,
        detectedLang: isMostlyArabic(text) ? "ar" : "en",
      });
    }

    return NextResponse.json(
      { error: "Unsupported file type. Use PDF / DOCX / TXT." },
      { status: 400 }
    );
  } catch (e: any) {
    console.error("/api/rfp/extract error:", e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
