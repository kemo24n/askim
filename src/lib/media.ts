const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE || "https://cdn.emenu.ae/media").replace(/\/$/, "");

/** Resolve a stored image path to a URL. Absolute URLs pass through. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
  return `${BASE}/${path}`;
}
