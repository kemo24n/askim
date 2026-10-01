/** Aşkım wordmark — Arabic calligraphy + spaced Latin caps, with the crimson rhombus from the brand. */
export function Logo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const s = {
    sm: { ar: "text-3xl", en: "text-[9px] tracking-[0.55em]", gem: 7 },
    md: { ar: "text-5xl", en: "text-[11px] tracking-[0.6em]", gem: 9 },
    lg: { ar: "text-7xl", en: "text-sm tracking-[0.7em]", gem: 12 },
    xl: { ar: "text-8xl sm:text-9xl", en: "text-base tracking-[0.8em]", gem: 15 },
  }[size];
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`} dir="rtl" aria-label="Aşkım أشكم">
      <div className="relative">
        <span className={`font-callig ${s.ar} leading-[1.15] text-champagne drop-shadow-[0_2px_20px_rgba(201,168,106,0.25)]`}>أشكم</span>
        <span
          className="absolute rotate-45 bg-crimson-2 shadow-[0_0_14px_rgba(179,38,42,0.7)]"
          style={{ width: s.gem, height: s.gem, top: "6%", right: "34%" }}
          aria-hidden
        />
      </div>
      <span dir="ltr" className={`font-latin ${s.en} -mt-1 ps-[0.6em] text-gold uppercase`}>Aşkım</span>
    </div>
  );
}
