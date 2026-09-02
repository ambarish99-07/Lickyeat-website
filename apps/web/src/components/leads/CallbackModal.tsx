"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { CreateLeadResponse } from "@/lib/apiTypes";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Select } from "@/components/ui/Field";
import { LeadSuccess } from "./LeadSuccess";

const TOPICS = [
  ["franchise", "Franchise"],
  ["catering", "Catering / events"],
  ["order-help", "Help with an order"],
  ["other", "Something else"],
] as const;

export function CallbackModal({
  open,
  onClose,
  defaultTopic = "other",
}: {
  open: boolean;
  onClose: () => void;
  defaultTopic?: (typeof TOPICS)[number][0];
}) {
  const [form, setForm] = useState({
    name: "",
    whatsapp: "",
    city: "",
    topic: defaultTopic,
    message: "",
    company: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<CreateLeadResponse | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post<CreateLeadResponse>("/leads?from=callback", {
        kind: "callback",
        name: form.name,
        whatsapp: form.whatsapp,
        city: form.city,
        topic: form.topic,
        message: form.message || undefined,
        callbackRequested: true,
        company: form.company || undefined,
      });
      setDone(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request a call back">
      {done ? (
        <LeadSuccess
          callbackRequested
          waText={`Hi Lickyeat, I've requested a call back about ${form.topic}. My name is ${form.name}.`}
        />
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <p className="text-sm text-muted">
            Leave your number and we&rsquo;ll call you within 24 hours.
          </p>
          <Field label="Your name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required autoFocus />
          </Field>
          <Field label="WhatsApp number">
            <Input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="10-digit mobile"
              required
            />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
          </Field>
          <Field label="What's it about?">
            <Select value={form.topic} onChange={(e) => set("topic", e.target.value as typeof form.topic)}>
              {TOPICS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Message (optional)">
            <textarea
              className="field min-h-[70px]"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </Field>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            className="hidden"
            aria-hidden
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary btn-md w-full" disabled={busy}>
            {busy ? "Sending…" : "Request call back"}
          </button>
        </form>
      )}
    </Modal>
  );
}
