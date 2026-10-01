/**
 * Photos are served from our own platform (`/media`, filled by `npm run images:pull`).
 * If a photo hasn't been downloaded yet, the browser falls back to the original CDN once,
 * so nothing breaks during migration — and once pulled, we no longer depend on eMenu at all.
 */
const BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE || "/media").replace(/\/$/, "");
const FALLBACK = (process.env.NEXT_PUBLIC_MEDIA_FALLBACK ?? "https://cdn.emenu.ae/media").replace(/\/$/, "");

const isAbsolute = (p: string) => /^https?:\/\//.test(p) || p.startsWith("/");

/** Resolve a stored image path to a URL. Absolute URLs pass through. */
export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (isAbsolute(path)) return path;
  return `${BASE}/${path}`;
}

/** Fallback URL for a stored path (null if none / already absolute). */
export function mediaFallback(path?: string | null): string | null {
  if (!path || isAbsolute(path) || !FALLBACK || FALLBACK === BASE) return null;
  return `${FALLBACK}/${path}`;
}

/** onError helper for plain <img>: try the fallback once, then give up. */
export function withFallback(path?: string | null, onFinalError?: (img: HTMLImageElement) => void) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const fb = mediaFallback(path);
    if (fb && img.dataset.fb !== "1") { img.dataset.fb = "1"; img.src = fb; return; }
    onFinalError?.(img);
  };
}
