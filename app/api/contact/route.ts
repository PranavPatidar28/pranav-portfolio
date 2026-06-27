import { NextResponse } from "next/server";
import { Resend } from "resend";
import { profile } from "@/lib/content";

/**
 * Contact form endpoint. Receives { name, email, message }, validates server
 * side, and sends the enquiry via Resend to the site owner.
 *
 * Env (set in Vercel project settings / .env.local — never committed):
 *   RESEND_API_KEY   — Resend API key
 *   CONTACT_FROM     — verified "from" address (e.g. "Portfolio <hello@yourdomain>")
 *                      Falls back to Resend's onboarding sender for first-run testing.
 *
 * Network-exposed but write-only to the owner's inbox: no auth needed. Spam is
 * deterred by a honeypot field + strict length caps, not a full rate limiter.
 */

const MAX = { name: 120, email: 200, message: 4000 } as const;

function isEmail(value: string): boolean {
  // Pragmatic check — not RFC-perfect, just enough to reject obvious junk.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Misconfiguration, not the visitor's fault — surface a clear 500.
    return NextResponse.json(
      { ok: false, error: "Email service is not configured." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const data = (body ?? {}) as Record<string, unknown>;

  // Honeypot — real users never fill this hidden field; bots do.
  if (typeof data.company === "string" && data.company.trim() !== "") {
    // Pretend success so the bot doesn't learn it was caught.
    return NextResponse.json({ ok: true });
  }

  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "All fields are required." },
      { status: 400 }
    );
  }
  if (
    name.length > MAX.name ||
    email.length > MAX.email ||
    message.length > MAX.message
  ) {
    return NextResponse.json(
      { ok: false, error: "One or more fields are too long." },
      { status: 400 }
    );
  }
  if (!isEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const resend = new Resend(apiKey);
  const from = process.env.CONTACT_FROM || "Portfolio <onboarding@resend.dev>";

  try {
    const { error } = await resend.emails.send({
      from,
      to: profile.email,
      replyTo: email,
      subject: `Portfolio enquiry from ${name}`,
      text: `${message}\n\n— ${name}\n${email}`,
    });

    if (error) {
      console.error("[contact] resend error:", error);
      return NextResponse.json(
        { ok: false, error: "Could not send your message. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Could not send your message. Please try again." },
      { status: 500 }
    );
  }
}
