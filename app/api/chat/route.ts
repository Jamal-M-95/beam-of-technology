import { NextResponse } from "next/server";
import { ChatSchema } from "@/lib/validators";
import { getGroq, getModel } from "@/lib/groq";
import { systemPrompt, chatPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ChatSchema.parse(body);

    const groq = getGroq();
    const model = getModel();

    const messages = [
      { role: "system" as const, content: systemPrompt(parsed.lang) },
      { role: "user" as const, content: chatPrompt(parsed.lang, parsed.rfpText || "") },
      ...parsed.messages.map((m) => ({ role: m.role as any, content: m.content }))
    ];

    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 800
    });

    const reply = completion.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "chat_failed" }, { status: 400 });
  }
}
