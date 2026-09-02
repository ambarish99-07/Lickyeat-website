import { env } from "../config/env.js";

/**
 * Meta WhatsApp Business Cloud API. Fail-silent if unconfigured — the caller
 * never needs to guard. Template names are placeholders pending real approval.
 */
export async function sendWhatsAppOrderUpdate(
  toPhone: string | null | undefined,
  message: string,
): Promise<void> {
  if (!env.whatsapp.configured || !toPhone) return;
  try {
    await fetch(`https://graph.facebook.com/v20.0/${env.whatsapp.phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.whatsapp.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toPhone.replace(/\D/g, ""),
        type: "text",
        text: { body: message },
      }),
    });
  } catch {
    /* fail-silent */
  }
}
