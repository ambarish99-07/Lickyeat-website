"use client";

import { useState } from "react";
import { CATERING_EVENT_TYPES, CATERING_MIN_GUESTS } from "@lickyeat/shared-types";
import { api, ApiError } from "@/lib/api";
import type { CreateLeadResponse } from "@/lib/apiTypes";
import { Field, Input, Select } from "@/components/ui/Field";
import { LeadSuccess } from "./LeadSuccess";

const EVENT_LABELS: Record<string, string> = {
  corporate: "Corporate / office",
  wedding: "Wedding / shaadi",
  birthday: "Birthday",
  "college-fest": "College fest",
  "house-party": "House party",
  other: "Other",
};

const BLANK = {
  name: "",
  whatsapp: "",
  email: "",
  city: "",
  eventType: "corporate",
  eventDate: "",
  guestCount: "",
  brands: [] as string[],
  venue: "",
  message: "",
  callbackRequested: true,
  company: "",
};

export function CateringEnquiryForm({
  brands,
}: {
  brands: Array<{ brandId: string; name: string }>;
}) {
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<CreateLeadResponse | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleBrand(id: string) {
    setForm((f) => ({
      ...f,
      brands: f.brands.includes(id) ? f.brands.filter((b) => b !== id) : [...f.brands, id],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const guests = Number(form.guestCount);
    if (!Number.isFinite(guests) || guests < CATERING_MIN_GUESTS) {
      setError(`Catering starts at ${CATERING_MIN_GUESTS} guests.`);
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<CreateLeadResponse>("/leads?from=catering", {
        kind: "catering",
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email || undefined,
        city: form.city,
        eventType: form.eventType,
        eventDate: form.eventDate || undefined,
        guestCount: guests,
        brands: form.brands,
        venue: form.venue || undefined,
        message: form.message || undefined,
        callbackRequested: form.callbackRequested,
        company: form.company || undefined,
      });
      setDone(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <LeadSuccess
        callbackRequested={form.callbackRequested}
        waText={`Hi Lickyeat, I'd like a catering quote for ~${form.guestCount} guests in ${form.city} (${
          EVENT_LABELS[form.eventType]
        }). My name is ${form.name}.`}
      />
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h3 className="font-display text-lg font-extrabold">Catering enquiry</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="WhatsApp number">
          <Input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            placeholder="10-digit mobile"
            required
          />
        </Field>
        <Field label="Email (optional)">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="City">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
        </Field>
        <Field label="Occasion">
          <Select value={form.eventType} onChange={(e) => set("eventType", e.target.value)}>
            {CATERING_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Event date (approx.)">
          <Input type="date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </Field>
        <Field label="Approx. guests" hint={`Minimum ${CATERING_MIN_GUESTS}.`}>
          <Input
            type="number"
            inputMode="numeric"
            value={form.guestCount}
            onChange={(e) => set("guestCount", e.target.value)}
            required
          />
        </Field>
        <Field label="Venue / area (optional)">
          <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} />
        </Field>
      </div>

      <div>
        <span className="field-label">What would you like? (pick any)</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {brands.map((b) => (
            <button
              key={b.brandId}
              type="button"
              onClick={() => toggleBrand(b.brandId)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                form.brands.includes(b.brandId)
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-ink/15 text-charcoal hover:border-ink/30"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <Field label="Anything else? (optional)">
        <textarea
          className="field min-h-[90px]"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
        <input
          type="checkbox"
          checked={form.callbackRequested}
          onChange={(e) => set("callbackRequested", e.target.checked)}
        />
        Call me back within 24 hours
      </label>

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
        {busy ? "Sending…" : "Request a quote"}
      </button>
    </form>
  );
}
