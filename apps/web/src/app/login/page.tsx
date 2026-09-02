"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthResponse } from "@lickyeat/shared-types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/state/authStore";
import { Field, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/";
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
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-extrabold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">One account across every Lickyeat kitchen.</p>
        <form onSubmit={submit} className="card mt-5 space-y-3 p-5">
          <Field label="Email or phone">
            <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoFocus />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button className="w-full" disabled={busy}>
            {busy ? "…" : "Log in"}
          </Button>
        </form>
        <p className="mt-3 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="link">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
