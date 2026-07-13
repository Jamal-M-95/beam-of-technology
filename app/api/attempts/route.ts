import { NextResponse } from "next/server";
import { claimAttempt, getAttemptStatus } from "@/lib/ip-attempts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const status = await getAttemptStatus(req);
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kind = body?.kind;

    if (kind !== "requirement" && kind !== "proposal") {
      return NextResponse.json({ error: "invalid_attempt_kind" }, { status: 400 });
    }

    const result = await claimAttempt(req, kind);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "attempt_locked",
          kind,
          ...result.status,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      ok: true,
      kind,
      ...result.status,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e || "attempt_failed") }, { status: 500 });
  }
}
