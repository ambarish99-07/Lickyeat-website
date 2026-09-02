"use client";

import { useEffect } from "react";
import { SWRConfig } from "swr";
import { swrFetcher } from "@/lib/api";
import { useAuth } from "@/state/authStore";
import { api } from "@/lib/api";
import type { User } from "@lickyeat/shared-types";

export function Providers({ children }: { children: React.ReactNode }) {
  const { token, hydrate, setUser, logout } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) return;
    api
      .get<{ user: User }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => logout());
  }, [token, setUser, logout]);

  return (
    <SWRConfig value={{ fetcher: swrFetcher, revalidateOnFocus: false }}>
      {children}
    </SWRConfig>
  );
}
