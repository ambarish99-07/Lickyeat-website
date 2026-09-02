/**
 * Relative URLs for images served from apps/api/public (mounted at /static in
 * app.ts). The web app turns these into same-origin /api/static/... URLs via its
 * own proxy + `assetUrl()` helper.
 */
export function menuImageUrl(slug: string | null | undefined): string | null {
  return slug ? `/static/menu-images/${slug}.jpg` : null;
}

export function tiffinImageUrl(slug: string | null | undefined): string | null {
  return slug ? `/static/tiffin-images/${slug}.jpg` : null;
}

export function brandLogoUrl(slug: string): string {
  return `/static/brands/${slug}.png`;
}

export function brandHeroUrl(slug: string): string {
  return `/static/brands/${slug}-hero.jpg`;
}
