import type { Metadata } from "next";
import { serverGet, serverGetOrNull } from "@/lib/serverApi";
import type { BrandResponse } from "@/lib/apiTypes";
import type { TiffinClosure } from "@lickyeat/shared-types";
import { BrandTheme } from "@/components/BrandTheme";
import { TiffinLanding } from "@/components/tiffin/TiffinLanding";

export const metadata: Metadata = {
  title: "GG Tiffin Service",
  description:
    "Home-style veg and non-veg tiffin in Patna — weekly or monthly subscriptions, or a single meal whenever you want one.",
};

export const revalidate = 120;

const FALLBACK = { primaryColor: "#b45309", accentColor: "#4d7c0f" };

export default async function TiffinPage() {
  const [brandData, closures] = await Promise.all([
    serverGetOrNull<BrandResponse>("/brands/gg-tiffin", { revalidate: 300 }),
    serverGet<{ closures: TiffinClosure[] }>("/tiffin/closures", { revalidate: 60 }),
  ]);
  const brand = brandData?.brand;

  return (
    <BrandTheme brand={brand ?? FALLBACK} as="div">
      <TiffinLanding brand={brand ?? null} closures={closures.closures} />
    </BrandTheme>
  );
}
