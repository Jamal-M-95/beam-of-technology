import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun } from "docx";

export const runtime = "nodejs";

type Lang = "en" | "ar";

function toParagraphs(text: string, rtl: boolean) {
  // Treat markdown-ish content as plain text blocks.
  const lines = text
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const isHeading = /^#{1,3}\s/.test(line);
    const isBullet = /^-\s/.test(line);
    const clean = line.replace(/^#{1,3}\s*/, "").replace(/^-\s*/, "");

    return new Paragraph({
      bidirectional: rtl,
      children: [
        new TextRun({
          text: (isBullet ? "• " : "") + clean,
          bold: isHeading,
          size: isHeading ? 30 : 24,
        }),
      ],
    });
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lang: Lang = body?.lang === "ar" ? "ar" : "en";
    const proposalMarkdown: string = body?.proposalMarkdown ?? body?.proposalText ?? "";

    if (!proposalMarkdown || typeof proposalMarkdown !== "string") {
      return NextResponse.json({ error: "Missing proposalMarkdown" }, { status: 400 });
    }

    const rtl = lang === "ar";

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: toParagraphs(proposalMarkdown, rtl),
        },
      ],
    });

   const buf = await Packer.toBuffer(doc);

// ✅ NextResponse يحتاج BodyInit (Uint8Array / ArrayBuffer) وليس Buffer مباشرة
const bytes = new Uint8Array(buf);

return new NextResponse(bytes, {
  headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": `attachment; filename="proposal-${lang}.docx"`,
  },
});

  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "docx_failed" }, { status: 400 });
  }
}
