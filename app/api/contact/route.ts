import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

function env(name: string, required = true) {
  const v = process.env[name];
  if (required && (!v || !String(v).trim())) {
    throw new Error(`Missing env: ${name}`);
  }
  return String(v || "").trim();
}

function safeStr(x: unknown, max = 5000) {
  return String(x ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, max);
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isPhone(s: string) {
  // عملي وبسيط: أرقام + رموز شائعة (+ - () مسافات) بطول منطقي
  return /^[+()\-.\s0-9]{7,20}$/.test(s);
}

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  phone?: string;
  message?: string;
};

export async function POST(req: Request) {
  const requestId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    const body = (await req.json()) as ContactPayload;

    const name = safeStr(body?.name, 120);
    const email = safeStr(body?.email, 200).toLowerCase();
    const company = safeStr(body?.company, 200);
    const phone = safeStr(body?.phone, 60);
    const message = safeStr(body?.message, 10000);

    // ✅ خليهم Required
    if (!name || !email || !company || !phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields (name, company, phone, email, message)." },
        { status: 400 }
      );
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    if (!isPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
    }

    const resend = new Resend(env("RESEND_API_KEY"));
    const to = env("CONTACT_TO_EMAIL");
    const from = env("CONTACT_FROM_EMAIL");

    console.log(`[contact] ${requestId} received`, {
      name,
      email,
      company,
      phone,
      messageChars: message.length,
    });

    const subject = `New Contact Request — ${name} (${company})`;

    const text = [
      `New message from Contact Us form`,
      ``,
      `Name: ${name}`,
      `Company: ${company}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      ``,
      `Message:`,
      message,
      ``,
      `Request ID: ${requestId}`,
    ].join("\n");

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.6;">
        <h2 style="margin:0 0 12px;">New Contact Request</h2>
        <p style="margin:0 0 8px;"><b>Name:</b> ${escapeHtml(name)}</p>
        <p style="margin:0 0 8px;"><b>Company:</b> ${escapeHtml(company)}</p>
        <p style="margin:0 0 8px;"><b>Phone:</b> ${escapeHtml(phone)}</p>
        <p style="margin:0 0 8px;"><b>Email:</b> ${escapeHtml(email)}</p>
        <p style="margin:16px 0 8px;"><b>Message:</b></p>
        <pre style="white-space:pre-wrap;background:#0b1220;color:#e5e7eb;padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">${escapeHtml(message)}</pre>
        <p style="margin:16px 0 0;opacity:.7;font-size:12px;">Request ID: ${escapeHtml(requestId)}</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
      reply_to: email, // لو واجهت مشكلة هنا، خبرني عشان نحولها لـ replyTo حسب نسخة resend
    } as any);

    if (error) {
      console.error(`[contact] ${requestId} resend_error`, error);
      return NextResponse.json({ error: "Email send failed.", requestId }, { status: 500 });
    }

    console.log(`[contact] ${requestId} sent`, { id: (data as any)?.id });
    return NextResponse.json({ ok: true, requestId });
  } catch (err: any) {
    console.error(`[contact] ${requestId} error`, err);
    return NextResponse.json(
      { error: String(err?.message || err), requestId },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
