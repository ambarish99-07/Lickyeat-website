/**
 * Server-side data fetching for public pages (SSR/SSG + SEO). The browser goes
 * through the /api rewrite; the server needs an absolute URL. Import only from
 * Server Components.
 */
const API_BASE =
  process.env.API_INTERNAL_URL ?? process.env.API_URL ?? "http://localhost:4100";

interface ServerFetchOpts {
  /** ISR revalidate window in seconds. 0 disables caching. */
  revalidate?: number;
  tags?: string[];
}

export async function serverGet<T>(
  path: string,
  { revalidate = 60, tags }: ServerFetchOpts = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    next: revalidate === 0 ? { revalidate: 0, tags } : { revalidate, tags },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new ServerApiError(res.status, `GET ${path} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

/** Returns null on 404 instead of throwing — for "does this brand exist" checks. */
export async function serverGetOrNull<T>(
  path: string,
  opts?: ServerFetchOpts,
): Promise<T | null> {
  try {
    return await serverGet<T>(path, opts);
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 404) return null;
    throw err;
  }
}

export class ServerApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
