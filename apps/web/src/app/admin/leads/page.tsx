"use client";

import { useState } from "react";
import useSWR from "swr";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@lickyeat/shared-types";
import { api } from "@/lib/api";
import type { LeadsResponse } from "@/lib/apiTypes";
import { formatDateTime, relativeTime } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui/misc";
import { toast } from "@/state/toastStore";

const KIND_LABEL: Record<string, string> = {
  franchise: "Franchise",
  catering: "Catering",
  callback: "Call back",
};

const STATUS_TONE: Record<LeadStatus, "neutral" | "brand" | "good" | "warn" | "bad"> = {
  new: "warn",
  contacted: "brand",
  "in-discussion": "brand",
  won: "good",
  lost: "neutral",
};

/** Hours since a callback was requested, and the SLA colour. */
function sla(lead: Lead): { label: string; className: string } | null {
  if (!lead.callbackRequested || lead.status !== "new") return null;
  const started = lead.callbackRequestedAt ?? lead.createdAt;
  const hrs = (Date.now() - new Date(started).getTime()) / 3_600_000;
  if (hrs >= 24) return { label: "overdue", className: "bg-rose-100 text-rose-700" };
  if (hrs >= 12) return { label: `${Math.round(24 - hrs)}h left`, className: "bg-amber-100 text-amber-800" };
  return { label: `${Math.round(24 - hrs)}h left`, className: "bg-emerald-100 text-emerald-700" };
}

export default function AdminLeads() {
  const [kind, setKind] = useState("");
  const [callbackOnly, setCallbackOnly] = useState(false);
  const query = new URLSearchParams();
  if (kind) query.set("kind", kind);
  if (callbackOnly) query.set("callback", "1");
  const key = `/leads${query.toString() ? `?${query}` : ""}`;
  const { data, mutate } = useSWR<LeadsResponse>(key);
  const [openId, setOpenId] = useState<string | null>(null);

  async function patch(id: string, body: { status?: LeadStatus; note?: string }) {
    try {
      await api.patch(`/leads/${id}`, body);
      mutate();
      toast("Updated", { tone: "success" });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", { tone: "error" });
    }
  }

  const leads = data?.leads ?? [];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-extrabold">Leads</h1>

      <div className="flex flex-wrap items-center gap-2">
        {[
          ["", "All"],
          ["franchise", "Franchise"],
          ["catering", "Catering"],
          ["callback", "Call back"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setKind(v)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              kind === v ? "bg-ink text-cream" : "text-charcoal hover:bg-ink/5"
            }`}
          >
            {l}
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm text-charcoal">
          <input
            type="checkbox"
            checked={callbackOnly}
            onChange={(e) => setCallbackOnly(e.target.checked)}
          />
          Callbacks due
        </label>
      </div>

      {leads.length === 0 && <EmptyState title="No leads yet" />}

      <div className="space-y-2">
        {leads.map((lead) => {
          const badge = sla(lead);
          const open = openId === lead.id;
          const d = lead.details as Record<string, unknown>;
          return (
            <div key={lead.id} className="card p-4">
              <button
                className="flex w-full flex-wrap items-center gap-3 text-left"
                onClick={() => setOpenId(open ? null : lead.id)}
              >
                <span className="chip bg-ink/8 text-charcoal">{KIND_LABEL[lead.kind]}</span>
                <span className="font-semibold">{lead.name}</span>
                <span className="text-sm text-muted">{lead.city}</span>
                <Badge tone={STATUS_TONE[lead.status]}>{lead.status}</Badge>
                {lead.callbackRequested && (
                  <span className="chip bg-brand-soft text-brand">call back</span>
                )}
                {badge && (
                  <span className={`chip ${badge.className}`}>{badge.label}</span>
                )}
                <span className="ml-auto text-xs text-muted">{relativeTime(lead.createdAt)}</span>
              </button>

              {open && (
                <div className="mt-3 space-y-3 border-t border-line pt-3 text-sm">
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    <a href={`tel:${lead.whatsapp}`} className="link">
                      📞 {lead.whatsapp}
                    </a>
                    <a
                      href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "").replace(/^(?!91)/, "91")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="link"
                    >
                      WhatsApp chat
                    </a>
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="link">
                        {lead.email}
                      </a>
                    )}
                    <span className="text-muted">Received {formatDateTime(lead.createdAt)}</span>
                  </div>

                  <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                    {Object.entries(d)
                      .filter(([, v]) => v !== "" && v != null && !(Array.isArray(v) && v.length === 0))
                      .map(([k, v]) => (
                        <div key={k}>
                          <dt className="inline text-muted">{k}: </dt>
                          <dd className="inline font-medium">
                            {Array.isArray(v) ? v.join(", ") : String(v)}
                          </dd>
                        </div>
                      ))}
                  </dl>

                  {lead.message && (
                    <p className="rounded-lg bg-sand/60 p-3 text-charcoal">{lead.message}</p>
                  )}

                  {lead.notes.length > 0 && (
                    <ul className="space-y-1">
                      {lead.notes.map((n, i) => (
                        <li key={i} className="text-xs text-muted">
                          {formatDateTime(n.at)} {n.by ? `· ${n.by}` : ""} — {n.body}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="field !w-auto !py-1.5 text-sm"
                      value={lead.status}
                      onChange={(e) => patch(lead.id, { status: e.target.value as LeadStatus })}
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <NoteInput onAdd={(note) => patch(lead.id, { note })} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoteInput({ onAdd }: { onAdd: (note: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex flex-1 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) {
          onAdd(v.trim());
          setV("");
        }
      }}
    >
      <input
        className="field !py-1.5 text-sm"
        placeholder="Add a note…"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <button className="btn-ghost btn-sm" type="submit">
        Add
      </button>
    </form>
  );
}
