import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createRequire } from "module";

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
    .replace(/\u00A0/g, " ") // NBSP -> normal space
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ✅ هل النص طالع "حروف عربي مفصولة"؟
function looksLikeSpacedArabic(s: string) {
  const letters = (s.match(/[\u0600-\u06FF]/g) || []).length;
  const pairs = (s.match(/[\u0600-\u06FF] [\u0600-\u06FF]/g) || []).length;
  return letters > 80 && pairs / letters > 0.15;
}

// ✅ يلغي المسافة الواحدة بين الحروف العربية، ويحافظ على مسافات الكلمات (2+)
function fixSpacedArabicFromPdf(s: string) {
  const PLACEHOLDER = "\uE000"; // placeholder مؤقت
  let t = s.replace(/ {2,}/g, PLACEHOLDER); // احفظ مسافات الكلمات

  // Arabic ranges + presentation forms
  const AR =
    "\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF";

  const re = new RegExp(`([${AR}]) ([${AR}])`, "g");

  // كرر لحد ما تخلص جميع الحالات
  while (re.test(t)) {
    t = t.replace(re, "$1$2");
  }

  // رجّع مسافات الكلمات
  t = t.replace(new RegExp(PLACEHOLDER, "g"), " ");

  // تنظيف بسيط
  t = t.replace(/ *\n */g, "\n");
  return t;
}

async function pdfToText(fileBuffer: Buffer) {
  // ✅ require داخل الفنكشن (حتى ما ينفذ وقت build/collect page data)
  const require = createRequire(import.meta.url);
  const pdfParse: any = require("pdf-parse/lib/pdf-parse.js"); // مهم

  const result = await pdfParse(fileBuffer);
  let text = result?.text || "";

  // ✅ طبق إصلاح العربي فقط عند الحاجة
  if (looksLikeSpacedArabic(text)) {
    text = fixSpacedArabicFromPdf(text);
  }

  return cleanText(text);
}

async function docxToText(fileBuffer: Buffer) {
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  return cleanText(result?.value || "");
}

export async function POST(req: Request) {
  try {
    // ✅ Guard: req.formData() على Vercel يرمي خطأ إذا content-type مش form
    const ct = req.headers.get("content-type") || "";
    if (
      !ct.includes("multipart/form-data") &&
      !ct.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        {
          error: "invalid_content_type",
          contentType: ct,
          expected: "multipart/form-data",
        },
        { status: 415 }
      );
    }

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
