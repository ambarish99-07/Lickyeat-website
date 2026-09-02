"use client";

import { useState } from "react";
import {
  FRANCHISE_INVESTMENT_BANDS,
  FRANCHISE_TIMEFRAMES,
  type FranchiseScope,
} from "@lickyeat/shared-types";
import { api, ApiError } from "@/lib/api";
import type { CreateLeadResponse } from "@/lib/apiTypes";
import { Field, Input, Select } from "@/components/ui/Field";
import { LeadSuccess } from "./LeadSuccess";

const BLANK = {
  name: "",
  whatsapp: "",
  email: "",
  city: "",
  scope: "single-brand" as FranchiseScope,
  brandId: "",
  hasSpace: false,
  investmentBand: "",
  timeframe: "",
  currentOccupation: "",
  message: "",
  callbackRequested: true,
  company: "", // honeypot
};

export function FranchiseEnquiryForm({
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.scope === "single-brand" && !form.brandId) {
      setError("Pick which brand you'd like to franchise.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<CreateLeadResponse>("/leads?from=franchise", {
        kind: "franchise",
        name: form.name,
        whatsapp: form.whatsapp,
        email: form.email || undefined,
        city: form.city,
        scope: form.scope,
        brandId: form.scope === "single-brand" ? form.brandId : undefined,
        hasSpace: form.hasSpace,
        investmentBand: form.investmentBand || undefined,
        timeframe: form.timeframe || undefined,
        currentOccupation: form.currentOccupation || undefined,
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
        brief={done.brief}
        callbackRequested={form.callbackRequested}
        waText={`Hi Lickyeat, I've enquired about a ${
          form.scope === "full-lickyeat" ? "full Lickyeat" : "single-brand"
        } franchise in ${form.city}. My name is ${form.name}.`}
      />
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <h3 className="font-display text-lg font-extrabold">Franchise enquiry</h3>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["single-brand", "One brand"],
            ["full-lickyeat", "Full Lickyeat"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => set("scope", value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              form.scope === value
                ? "border-brand bg-brand-soft text-brand"
                : "border-ink/15 text-charcoal hover:border-ink/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {form.scope === "single-brand" && (
        <Field label="Which brand?">
          <Select value={form.brandId} onChange={(e) => set("brandId", e.target.value)}>
            <option value="">Select a brand…</option>
            {brands.map((b) => (
              <option key={b.brandId} value={b.brandId}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="WhatsApp number" hint="We'll send the franchise brief here.">
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
        <Field label="City / town you want to open in">
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} required />
        </Field>
        <Field label="Investment you can commit">
          <Select
            value={form.investmentBand}
            onChange={(e) => set("investmentBand", e.target.value)}
          >
            <option value="">Prefer not to say</option>
            {FRANCHISE_INVESTMENT_BANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="How soon?">
          <Select value={form.timeframe} onChange={(e) => set("timeframe", e.target.value)}>
            <option value="">Not sure</option>
            {FRANCHISE_TIMEFRAMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="What do you do currently? (optional)">
        <Input
          value={form.currentOccupation}
          onChange={(e) => set("currentOccupation", e.target.value)}
          placeholder="Business, job, other franchises…"
        />
      </Field>

      <Field label="Anything else? (optional)">
        <textarea
          className="field min-h-[90px]"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
        />
      </Field>

      <label className="flex items-center gap-2 text-sm text-charcoal">
        <input
          type="checkbox"
          checked={form.hasSpace}
          onChange={(e) => set("hasSpace", e.target.checked)}
        />
        I already have a shop / space in mind
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
        <input
          type="checkbox"
          checked={form.callbackRequested}
          onChange={(e) => set("callbackRequested", e.target.checked)}
        />
        Call me back within 24 hours
      </label>

      {/* honeypot */}
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
        {busy ? "Sending…" : "Send enquiry"}
      </button>
      <p className="text-xs text-muted">
        By sending this you agree to be contacted by the Lickyeat franchise team.
      </p>
    </form>
  );
}
