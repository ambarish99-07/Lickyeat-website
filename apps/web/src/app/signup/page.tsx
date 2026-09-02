"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthResponse } from "@lickyeat/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/state/authStore";

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post<AuthResponse>("/auth/signup", {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
      });
      setSession(res);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form onSubmit={submit} className="card mt-4 space-y-3 p-5">
        <div>
          <span className="label">Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <span className="label">Email</span>
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <span className="label">Phone</span>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="10-digit mobile"
          />
        </div>
        <div>
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="at least 8 characters"
          />
        </div>
        <p className="text-xs text-black/45">Give an email, a phone, or both.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "…" : "Sign up"}
        </button>
      </form>
      <p className="mt-3 text-center text-sm text-black/55">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    </div>
  );
}
