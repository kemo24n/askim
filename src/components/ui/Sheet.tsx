"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Bottom sheet on mobile, centered panel on desktop. Swipe down / Esc / backdrop to close. */
export function Sheet({
  open, onClose, children, title, full = false, labelClose = "Close", tall = false, bare = false,
}: {
  open: boolean; onClose: () => void; children: ReactNode; title?: ReactNode; full?: boolean; labelClose?: string; tall?: boolean; bare?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const onTouchStart = (e: React.TouchEvent) => {
    if ((panel.current?.scrollTop ?? 0) > 0) return;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null || !panel.current) return;
    const dy = Math.max(0, e.touches[0].clientY - startY.current);
    panel.current.style.transform = `translateY(${dy}px)`;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current == null || !panel.current) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (dy > 110) onClose();
    else panel.current.style.transform = "";
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button aria-label={labelClose} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade" />
      <div
        ref={panel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`relative w-full ${full ? "h-[100dvh] sm:h-[92vh] sm:max-w-2xl" : `${tall ? "max-h-[94dvh]" : "max-h-[88dvh]"} sm:max-w-xl`} overflow-y-auto overscroll-contain no-scrollbar rounded-t-[28px] sm:rounded-[28px] bg-noir border border-gold/15 shadow-2xl animate-sheet sm:animate-rise transition-transform duration-200`}
      >
        <div className={`sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-3 pb-2 ${bare ? "" : "bg-gradient-to-b from-noir via-noir/95 to-noir/0"}`}>
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-gold/25 sm:hidden" />
          <div className="pt-3 min-w-0 flex-1">{title}</div>
          <button onClick={onClose} aria-label={labelClose} className={`mt-3 grid h-9 w-9 shrink-0 place-items-center rounded-full text-champagne/90 ${bare ? "bg-black/55 backdrop-blur" : "bg-white/5 hover:bg-white/10"}`}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
