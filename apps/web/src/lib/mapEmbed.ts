/**
 * Google's free keyless Maps embed refuses to render as a WebView / iframe
 * top-level document ("must be used in an iframe"). We wrap it in a data: URL
 * HTML document that itself contains the real <iframe>, which renders fine.
 * Shows the delivery address, not a live rider position (no GPS feed exists).
 */
export function mapEmbedSrcDoc(query: string): string {
  const q = encodeURIComponent(query);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{margin:0;border:0;width:100%;height:100%}</style></head><body><iframe src="https://www.google.com/maps?q=${q}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></body></html>`;
}
