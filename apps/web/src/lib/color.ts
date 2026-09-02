/** "#6d28d9" -> "109 40 217" (space-separated RGB channels for Tailwind's alpha syntax). */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n) || full.length !== 6) return "14 165 233";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Relative luminance (0..1) of a hex colour. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgbChannels(hex).split(" ").map((c) => Number(c) / 255) as [number, number, number];
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Readable text colour to sit on a given brand colour: near-white or near-ink. */
export function contrastInk(hex: string): string {
  return luminance(hex) > 0.55 ? "33 27 23" : "255 255 255";
}

export interface BrandThemeVars {
  "--brand": string;
  "--brand-accent": string;
  "--brand-ink": string;
}

export function brandThemeVars(brand: {
  primaryColor: string;
  accentColor: string;
}): BrandThemeVars {
  return {
    "--brand": hexToRgbChannels(brand.primaryColor),
    "--brand-accent": hexToRgbChannels(brand.accentColor),
    "--brand-ink": contrastInk(brand.primaryColor),
  };
}
