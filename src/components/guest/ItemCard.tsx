"use client";
import { Flame, Leaf, Plus, Users, Sparkles } from "lucide-react";
import { loc } from "@/lib/i18n";
import type { MenuItem } from "@/lib/types";
import { Img } from "@/components/ui/Img";
import { useMenu } from "./context";

export function TagIcons({ item }: { item: MenuItem }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-mist">
      {item.tags.includes("spicy") && <Flame size={13} className="text-rose" aria-label="spicy" />}
      {item.tags.includes("vegetarian") && <Leaf size={13} className="text-emerald-400/80" aria-label="vegetarian" />}
      {item.serves > 1 && <Users size={13} aria-label={`serves ${item.serves}`} />}
    </span>
  );
}

/** Elegant list row used in the menu sections. */
export function ItemRow({ item }: { item: MenuItem }) {
  const { lang, d, price, openItem, table, addToCart } = useMenu();
  const name = loc(item, "name", lang);
  const desc = loc(item, "desc", lang);
  const quickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.options.length) return openItem(item.id);
    await addToCart(item.id);
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => openItem(item.id)}
      onKeyDown={(e) => e.key === "Enter" && openItem(item.id)}
      className={`group relative flex gap-4 rounded-3xl p-3 transition-colors hover:bg-white/[0.03] ${!item.available ? "opacity-45" : ""}`}
    >
      <Img src={item.image} alt={name} label={name.slice(0, 1)} className="h-[104px] w-[104px] shrink-0 rounded-2xl ring-1 ring-gold/10" imgClassName="group-hover:scale-105" />
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="flex items-start gap-2">
          <h3 className="font-display text-[1.35rem] leading-tight text-champagne">{name}</h3>
          {item.signature && <Sparkles size={14} className="mt-1.5 shrink-0 text-gold" aria-label={d.signature} />}
        </div>
        {desc && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-mist">{desc}</p>}
        <div className="mt-auto flex items-center gap-3 pt-2">
          <span className="font-medium tabular-nums text-gold">{price(item.price)}</span>
          <TagIcons item={item} />
          {item.today >= 3 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-rose/90">
              <Flame size={11} /> {d.orderedTonight(item.today)}
            </span>
          )}
        </div>
      </div>
      {table && item.available && (
        <button
          onClick={quickAdd}
          aria-label={d.add}
          className="absolute bottom-3 end-3 grid h-9 w-9 place-items-center rounded-full border border-gold/30 bg-black/40 text-gold transition hover:bg-gold hover:text-ink active:scale-90"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );
}

/** Cinematic portrait card for rails (signature / right now). */
export function ItemPoster({ item, size = "lg" }: { item: MenuItem; size?: "lg" | "md" }) {
  const { lang, d, price, openItem } = useMenu();
  const name = loc(item, "name", lang);
  const dims = size === "lg" ? "w-[72vw] max-w-[300px] aspect-[3/4]" : "w-[44vw] max-w-[200px] aspect-[4/5]";
  return (
    <button onClick={() => openItem(item.id)} className={`group relative ${dims} shrink-0 snap-start overflow-hidden rounded-[26px] text-start ring-1 ring-gold/15`}>
      <Img src={item.image} alt={name} label={name.slice(0, 1)} className="absolute inset-0" imgClassName="group-hover:scale-[1.06] duration-[1200ms]" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
      {item.today >= 3 && (
        <span className="absolute top-3 start-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[10px] text-champagne backdrop-blur">
          <Flame size={11} className="text-rose" /> {d.orderedTonight(item.today)}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className={`font-display ${size === "lg" ? "text-2xl" : "text-lg"} leading-tight text-champagne`}>{name}</div>
        <div className="mt-1 text-sm text-gold tabular-nums">{price(item.price)}</div>
      </div>
    </button>
  );
}
