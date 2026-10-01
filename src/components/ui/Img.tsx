"use client";
import { useState } from "react";
import { mediaUrl, withFallback } from "@/lib/media";

/** Image with a graceful branded fallback when the photo is missing or fails. */
export function Img({
  src, alt, className = "", imgClassName = "", eager = false, label,
}: { src?: string | null; alt: string; className?: string; imgClassName?: string; eager?: boolean; label?: string }) {
  const url = mediaUrl(src);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden img-fallback ${className}`}>
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={withFallback(src, () => setFailed(true))}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ease-(--ease-lux) ${loaded ? "opacity-100" : "opacity-0 scale-[1.03]"} ${imgClassName}`}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-70" aria-hidden data-label={label}>
          <span className="h-2.5 w-2.5 rotate-45 bg-crimson-2/80 shadow-[0_0_12px_rgba(179,38,42,0.6)]" />
          <span className="h-px w-8 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>
      )}
    </div>
  );
}
