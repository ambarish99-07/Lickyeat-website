import { env } from "../../config/env.js";

/**
 * Outbound notifications for the lead pipeline. Every channel degrades to a
 * console line when its credentials aren't configured, so the lead is never
 * lost — it's always in the DB and the admin alert queue regardless.
 */

type Skip = { ok: false; skipped: true; reason: string };
type Sent = { ok: true; channel: string };
type Result = Sent | Skip;

function log(msg: string) {
  // eslint-disable-next-line no-console
  console.log(`[notify] ${msg}`);
}

/** WhatsApp Cloud API text message (used for ops alerts). Templates needed for
 *  customer-initiated-outside-24h messaging in production. */
export async function sendWhatsAppText(to: string, body: string): Promise<Result> {
  if (!env.whatsapp.configured) {
    return { ok: false, skipped: true, reason: "whatsapp not configured" };
  }
  const digits = to.replace(/\D/g, "");
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${env.whatsapp.phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: digits,
        type: "text",
        text: { body },
      }),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log(`whatsapp send failed (${res.status}): ${detail.slice(0, 300)}`);
    return { ok: false, skipped: true, reason: `whatsapp ${res.status}` };
  }
  return { ok: true, channel: "whatsapp" };
}

async function sendEmail(subject: string, text: string): Promise<Result> {
  const to = env.opsNotify.email;
  const key = env.opsNotify.resendApiKey;
  if (!to) return { ok: false, skipped: true, reason: "ops email not configured" };
  if (!key) {
    log(`email would go to ${to}: ${subject}`);
    return { ok: false, skipped: true, reason: "no email transport (RESEND_API_KEY)" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.opsNotify.email ? `Lickyeat <alerts@lickyeat.com>` : "onboarding@resend.dev",
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    log(`email send failed (${res.status}): ${detail.slice(0, 300)}`);
    return { ok: false, skipped: true, reason: `email ${res.status}` };
  }
  return { ok: true, channel: "email" };
}

async function sendWebhook(payload: unknown): Promise<Result> {
  const url = env.opsNotify.webhookUrl;
  if (!url) return { ok: false, skipped: true, reason: "no ops webhook" };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false, skipped: true, reason: `webhook ${res.status}` };
  return { ok: true, channel: "webhook" };
}

export interface OpsAlertInput {
  title: string;
  body: string;
  leadId: string;
  priority: "normal" | "high";
}

/**
 * Fan out an ops alert to every configured channel. Returns the channels that
 * actually delivered — an empty array means "admin panel only for now", which is
 * fine because the AdminAlert row is already persisted.
 */
export async function dispatchOpsAlert(input: OpsAlertInput): Promise<string[]> {
  const prefix = input.priority === "high" ? "🔔 CALLBACK REQUESTED" : "New lead";
  const text = `${prefix}\n\n${input.title}\n${input.body}\n\nOpen: /admin/leads`;

  const results = await Promise.allSettled([
    env.opsNotify.whatsappNumber
      ? sendWhatsAppText(env.opsNotify.whatsappNumber, text)
      : Promise.resolve<Result>({ ok: false, skipped: true, reason: "no ops whatsapp" }),
    sendEmail(`[Lickyeat] ${prefix}: ${input.title}`, text),
    sendWebhook({ ...input, text }),
  ]);

  const delivered: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) delivered.push(r.value.channel);
  }
  if (delivered.length === 0) {
    log(`ops alert "${input.title}" — no external channel configured, admin panel only`);
  }
  return delivered;
}
