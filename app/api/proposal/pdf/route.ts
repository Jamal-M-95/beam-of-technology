import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createRequire } from "module";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const require = createRequire(import.meta.url);

// ✅ لا تستورد "pdf-parse" مباشرة (entry) لتجنب debug mode
const pdfParse: any = require("pdf-parse/lib/pdf-parse.js");

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

async function pdfToText(fileBuffer: Buffer) {
  const result = await pdfParse(fileBuffer);
  return cleanText(result?.text || "");
}

async function docxToText(fileBuffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  return cleanText(result?.value || "");
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
