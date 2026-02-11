import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

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

async function ensureBinary(bin: string, hint: string) {
  try {
    await execFileAsync("which", [bin]);
  } catch {
    throw new Error(`${bin}_missing: ${hint}`);
  }
}

async function pdfToTextWithPoppler(fileBuffer: Buffer) {
  // Requires: pdftotext (poppler)
  await ensureBinary(
    "pdftotext",
    "Install Poppler (pdftotext). On macOS: brew install poppler"
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rfp-"));
  const inPath = path.join(tmpDir, "rfp.pdf");
  const outPath = path.join(tmpDir, "rfp.txt");

  try {
    await fs.writeFile(inPath, fileBuffer);

    // -layout keeps reading order better
    // -enc UTF-8 forces UTF-8 output
    await execFileAsync("pdftotext", ["-layout", "-enc", "UTF-8", inPath, outPath]);

    const text = await fs.readFile(outPath, "utf8");
    return cleanText(text);
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

async function docxToTextWithPandoc(fileBuffer: Buffer) {
  // Requires: pandoc
  await ensureBinary(
    "pandoc",
    "Install Pandoc. On macOS: brew install pandoc"
  );

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rfp-"));
  const inPath = path.join(tmpDir, "rfp.docx");
  const outPath = path.join(tmpDir, "rfp.txt");

  try {
    await fs.writeFile(inPath, fileBuffer);

    // DOCX -> plain text (UTF-8). Works well for Arabic/English.
    await execFileAsync("pandoc", [inPath, "-t", "plain", "-o", outPath]);

    const text = await fs.readFile(outPath, "utf8");
    return cleanText(text);
  } finally {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = (file.name || "").toLowerCase();

    // TXT
    if (name.endsWith(".txt") || file.type === "text/plain") {
      const text = cleanText(bytes.toString("utf8"));
      return NextResponse.json({
        text,
        detectedLang: isMostlyArabic(text) ? "ar" : "en",
      });
    }

    // PDF
    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const text = await pdfToTextWithPoppler(bytes);
      return NextResponse.json({
        text,
        detectedLang: isMostlyArabic(text) ? "ar" : "en",
      });
    }

    // DOCX
    if (
      name.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const text = await docxToTextWithPandoc(bytes);
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
    // Helpful server-side logging
    console.error("/api/rfp/extract error:", e);
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
