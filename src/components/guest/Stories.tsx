"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Pause, Play, Plus, X } from "lucide-react";
import { loc } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { MenuItem } from "@/lib/types";
import { useMenu } from "./context";
import { Logo } from "./Logo";

const DURATION = 5200;

export function Stories({ open, onClose, items }: { open: boolean; onClose: () => void; items: MenuItem[] }) {
  const { lang, d, price, table, addToCart, openItem } = useMenu();
  const list = useMemo(() => items.filter((i) => i.image).slice(0, 18), [items]);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [key, setKey] = useState(0);

  const go = useCallback((n: number) => {
    setIdx((i) => {
      const next = i + n;
      if (next >= list.length) { onClose(); return 0; }
      return Math.max(0, next);
    });
    setKey((k) => k + 1);
  }, [list.length, onClose]);

  useEffect(() => {
    if (!open || paused) return;
    const tmr = setTimeout(() => go(1), DURATION);
    return () => clearTimeout(tmr);
  }, [open, paused, idx, key, go]);

  useEffect(() => {
    if (!open) return;
    setIdx(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(lang === "ar" ? -1 : 1);
      if (e.key === "ArrowLeft") go(lang === "ar" ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose, go, lang]);

  if (!open || !list.length || typeof document === "undefined") return null;
  const item = list[idx];
  const name = loc(item, "name", lang);
  const desc = loc(item, "desc", lang);

  return createPortal(
    <div className="fixed inset-0 z-[55] bg-ink animate-fade select-none">
      {/* image with Ken Burns */}
      <div key={item.id} className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mediaUrl(item.image)!} alt={name} className="h-full w-full object-cover animate-[kenburns_7s_ease-out_both]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-ink" />
      </div>
      <style>{`@keyframes kenburns{from{transform:scale(1.18) translate3d(0,2%,0)}to{transform:scale(1.02)}}`}</style>

      {/* progress */}
      <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-3 pt-[max(12px,env(safe-area-inset-top))]">
        {list.map((it, i) => (
          <div key={it.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              key={i === idx ? key : undefined}
              className={`h-full origin-left rtl:origin-right bg-champagne ${i < idx ? "scale-x-100" : i === idx ? "animate-story" : "scale-x-0"}`}
              style={i === idx ? { animationDuration: `${DURATION}ms`, animationPlayState: paused ? "paused" : "running" } : undefined}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-6 z-10 flex items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <Logo size="sm" />
        <div className="flex gap-2">
          <button onClick={() => setPaused((p) => !p)} className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur" aria-label="pause">{paused ? <Play size={16} /> : <Pause size={16} />}</button>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/40 backdrop-blur" aria-label={d.close}><X size={18} /></button>
        </div>
      </div>

      {/* tap zones */}
      <button aria-label="prev" className="absolute inset-y-0 start-0 z-[5] w-1/3" onClick={() => go(-1)}
        onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} />
      <button aria-label="next" className="absolute inset-y-0 end-0 z-[5] w-2/3" onClick={() => go(1)}
        onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} />

      {/* caption */}
      <div key={`c${item.id}`} className="absolute inset-x-0 bottom-0 z-10 px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
        <div className="animate-rise text-xs uppercase tracking-[0.3em] text-gold">{idx + 1} / {list.length}</div>
        <h2 className="animate-rise mt-2 font-display text-5xl leading-[1.05] text-champagne [animation-delay:80ms]">{name}</h2>
        {desc && <p className="animate-rise mt-3 line-clamp-3 max-w-md text-[15px] leading-relaxed text-champagne/80 [animation-delay:160ms]">{desc}</p>}
        <div className="animate-rise mt-5 flex items-center gap-3 [animation-delay:240ms]">
          <span className="text-2xl text-gold tabular-nums">{price(item.price)}</span>
          <div className="flex-1" />
          <button onClick={() => { onClose(); openItem(item.id); }} className="btn-ghost rounded-full px-5 py-3 text-sm backdrop-blur">{d.tapToExplore}</button>
          {table && item.available && (
            <button onClick={() => addToCart(item.id)} className="btn-gold grid h-12 w-12 place-items-center rounded-full" aria-label={d.add}><Plus /></button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
