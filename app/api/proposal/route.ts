import { NextResponse } from "next/server";
import { ProposalSchema } from "@/lib/validators";
import { getGroq, getModel } from "@/lib/groq";
import { systemPrompt, proposalPrompt } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ProposalSchema.parse(body);

    const groq = getGroq();
    const model = getModel();

    const prompt = proposalPrompt({
      lang: parsed.lang,
      rfpText: parsed.rfpText,
      previousProposal: parsed.previousProposal
    });

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt(parsed.lang) },
        { role: "user", content: prompt }
      ],
      temperature: 0.25,
      max_tokens: 4000
    });

    const proposalMarkdown = completion.choices?.[0]?.message?.content || "";
    return NextResponse.json({ proposalMarkdown });
  } catch (e: any) {
    const msg = String(e?.message || e || "proposal_failed");
    // If the issue is server configuration, return 500 so it's not mistaken for a bad client request.
    const isServerConfig = msg.toLowerCase().includes("groq_api_key") || msg.toLowerCase().includes("api key");
    const status = isServerConfig ? 500 : 400;
    return NextResponse.json(
      {
        error: msg,
        hint: isServerConfig
          ? "Set GROQ_API_KEY in .env.local then restart: `GROQ_API_KEY=...`"
          : undefined
      },
      { status }
    );
  }
}
