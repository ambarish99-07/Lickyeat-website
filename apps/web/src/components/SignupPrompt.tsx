"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AuthResponse } from "@lickyeat/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/state/authStore";
import { CloseIcon } from "@/components/ui/icons";

const KEY = "lky_signup_prompt_seen";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // re-show 3 days after a dismissal
const HIDE_ON = ["/login", "/signup", "/admin", "/checkout"];

export function SignupPrompt() {
  const pathname = usePathname();
  const { setSession } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Read localStorage directly so this doesn't wait on auth-store hydration.
    try {
      const seenAt = Number(window.localStorage.getItem(KEY) ?? 0);
      if (seenAt && Date.now() - seenAt < SNOOZE_MS) return;
      if (window.localStorage.getItem("lky_token")) return; // already signed in
    } catch {
      /* private mode etc. — still show */
    }
    if (HIDE_ON.some((p) => pathname.startsWith(p))) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  if (!open) return null;

  const isEmail = /@/.test(form.contact);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post<AuthResponse>("/auth/signup", {
        name: form.name,
        email: isEmail ? form.contact.trim() : undefined,
        phone: isEmail ? undefined : form.contact.trim(),
        password: form.password,
      });
      setSession(res);
      dismiss();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
      onClick={dismiss}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign up for Lickyeat"
        className="relative w-full max-w-md animate-fade-up overflow-hidden rounded-3xl bg-surface shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-brand-ink/15 text-brand-ink hover:bg-brand-ink/25"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="surface-brand px-6 py-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-70">Welcome to Lickyeat</p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold leading-tight">
            Sign up &amp; get 50% off your first order
          </h2>
          <p className="mt-1.5 text-sm text-brand-ink/85">
            Use code <span className="font-bold">WELCOME50</span> at checkout — 50% off, up to ₹100.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3 px-6 py-6">
          <input
            className="field"
            placeholder="Your name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="field"
            placeholder="Email or 10-digit phone"
            required
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
          />
          <input
            className="field"
            type="password"
            placeholder="Password (min 8 characters)"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating…" : "Sign up"}
          </button>

          <div className="flex items-center justify-between pt-1 text-sm">
            <button type="button" onClick={dismiss} className="font-semibold text-charcoal hover:text-ink">
              Browse the menu
            </button>
            <Link href="/login" onClick={dismiss} className="text-muted hover:text-ink">
              I have an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
