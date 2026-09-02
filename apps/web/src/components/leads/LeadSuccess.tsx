"use client";

import useSWR from "swr";
import type { ContactResponse } from "@/lib/apiTypes";
import { waLink } from "@/lib/whatsapp";

/**
 * Shown after any enquiry is submitted. Renders the brief on-screen immediately
 * and — if a business WhatsApp number is configured — a deep link to continue
 * the conversation there. The true automated outbound message is wired via the
 * Meta WhatsApp API on the server and switches on once credentials exist.
 */
export function LeadSuccess({
  brief,
  callbackRequested,
  waText,
}: {
  brief?: string;
  callbackRequested: boolean;
  waText: string;
}) {
  const { data } = useSWR<ContactResponse>("/leads/contact");
  const link = waLink(data?.whatsappNumber, waText);

  return (
    <div className="surface-brand rounded-3xl p-7">
      <h3 className="font-display text-xl font-extrabold text-brand-ink">Got it — thank you.</h3>
      <p className="mt-1.5 text-sm text-brand-ink/80">
        {callbackRequested
          ? "Our team will call you within 24 hours."
          : "We've logged your enquiry and will be in touch shortly."}
      </p>

      {brief && (
        <div className="mt-4 rounded-2xl bg-brand-ink/10 p-4 text-sm text-brand-ink/90">
          <pre className="whitespace-pre-wrap font-sans leading-relaxed">{brief}</pre>
        </div>
      )}

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="btn-dark btn-md mt-5 inline-flex"
        >
          Continue on WhatsApp
        </a>
      )}
    </div>
  );
}
