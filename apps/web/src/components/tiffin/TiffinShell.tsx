"use client";

import Link from "next/link";
import useSWR from "swr";
import type { Brand } from "@lickyeat/shared-types";
import { BrandTheme } from "@/components/BrandTheme";

const FALLBACK = { primaryColor: "#b45309", accentColor: "#4d7c0f" };

export function TiffinShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { data } = useSWR<{ brand: Brand }>("/brands/gg-tiffin");
  const brand = data?.brand ?? FALLBACK;

  return (
    <BrandTheme brand={brand} as="div">
      <div className="container-page py-10">
        <Link href="/tiffin" className="text-sm font-semibold text-muted hover:text-ink">
          ← GG Tiffin
        </Link>
        <h1 className="mt-2 font-display text-3xl font-extrabold">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </BrandTheme>
  );
}
