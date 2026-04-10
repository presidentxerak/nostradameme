import "server-only";

import { Resend } from "resend";
import { env } from "@/lib/config/env";
import { COPY } from "@/lib/config/copy";

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (cached) return cached;
  cached = new Resend(env.RESEND_API_KEY);
  return cached;
}

export interface SendEmailArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(args: SendEmailArgs): Promise<boolean> {
  const client = getResend();
  if (!client) {
    // eslint-disable-next-line no-console
    console.warn("[resend] skipped, no API key:", args.subject);
    return false;
  }
  try {
    await client.emails.send({
      from: `${COPY.app.name} <oracle@${COPY.app.domain}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[resend] error", err);
    return false;
  }
}

export function buildResolutionEmail(params: {
  username: string;
  question: string;
  won: boolean;
  amount: number;
  marketUrl: string;
}): { subject: string; html: string } {
  const subject = params.won
    ? `\ud83c\udfc6 The oracle smiled upon you`
    : `\ud83d\udd2e The oracle has spoken`;
  const body = params.won
    ? `<p>Your prophecy was right. You won $${params.amount.toFixed(2)}.</p>`
    : `<p>The oracle disagreed. Better luck next time.</p>`;
  const html = `
    <div style="font-family:Inter,sans-serif;background:#0a0a0f;color:#f8fafc;padding:32px;">
      <h1 style="color:#7c3aed;">${COPY.oracle.spoken}</h1>
      <p><strong>${params.question}</strong></p>
      ${body}
      <p><a href="${params.marketUrl}" style="color:#9d5cf0;">See the prophecy</a></p>
    </div>`;
  return { subject, html };
}
