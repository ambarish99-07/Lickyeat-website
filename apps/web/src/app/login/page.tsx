"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthResponse } from "@lickyeat/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/state/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuth((s) => s.setSession);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post<AuthResponse>("/auth/login", { identifier, password });
      setSession(res);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Log in</h1>
      <form onSubmit={submit} className="card mt-4 space-y-3 p-5">
        <div>
          <span className="label">Email or phone</span>
          <input className="input" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        </div>
        <div>
          <span className="label">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "…" : "Log in"}
        </button>
      </form>
      <p className="mt-3 text-center text-sm text-black/55">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand">
          Create an account
        </Link>
      </p>
    </div>
  );
}
