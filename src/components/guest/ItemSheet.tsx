"use client";
import { useEffect, useState } from "react";
import { Clock, Flame, Gift, Minus, Plus, QrCode, Sparkles, Users } from "lucide-react";
import { loc } from "@/lib/i18n";
import { Img } from "@/components/ui/Img";
import { Sheet } from "@/components/ui/Sheet";
import { useMenu } from "./context";
import { TagIcons } from "./ItemCard";

const GIFTABLE = new Set(["dessert", "drink", "shisha"]);

export function ItemSheet({ onGift }: { onGift: (itemId: number) => void }) {
  const { openedItem, openItem, itemsById, lang, d, price, table, addToCart, data } = useMenu();
  const item = openedItem ? itemsById.get(openedItem) : undefined;
  const [qty, setQty] = useState(1);
  const [optionId, setOptionId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQty(1); setNote(""); setOptionId(item?.options[0]?.id ?? null);
  }, [item]);

  if (!item) return null;
  const name = loc(item, "name", lang);
  const desc = loc(item, "desc", lang);
  const opt = item.options.find((o) => o.id === optionId);
  const unit = item.price + (opt?.priceDelta ?? 0);
  const pairings = item.pairings.map((id) => itemsById.get(id)).filter((x): x is NonNullable<typeof x> => !!x && x.available);
  const tagLabels = item.tags.map((tg) => d.filters[tg as keyof typeof d.filters]).filter(Boolean);

  const add = async () => {
    setBusy(true);
    const okd = await addToCart(item.id, { optionId, qty, note: note.trim() || undefined });
    setBusy(false);
    if (okd) openItem(null);
  };

  return (
    <Sheet open onClose={() => openItem(null)} labelClose={d.close} tall bare>
      <div className="-mt-[60px]">
        <div className="relative">
          <Img src={item.image} alt={name} label={name.slice(0, 1)} eager className="aspect-[4/3] w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/10 to-transparent" />
          {item.signature && (
            <span className="absolute bottom-5 start-5 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold backdrop-blur">
              <Sparkles size={12} /> {d.signature}
            </span>
          )}
        </div>
        <div className="px-6 pb-8">
          <h2 className="font-display text-[2.1rem] leading-[1.1] text-champagne">{name}</h2>
          {lang === "ar" ? (
            <div className="mt-1 font-latin text-lg text-smoke" dir="ltr">{item.nameEn}</div>
          ) : (
            <div className="mt-1 font-callig text-xl text-smoke" dir="rtl">{item.nameAr}</div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-mist">
            <span className="text-xl font-medium text-gold tabular-nums">{price(unit)}</span>
            {data.settings.showOldSYP && <span className="text-xs text-smoke tabular-nums">{new Intl.NumberFormat(lang === "ar" ? "ar-SY" : "en-US").format(unit * 100)} {d.oldSyp}</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-mist">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5"><Clock size={13} /> {d.minutes(item.prepMinutes)}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5"><Users size={13} /> {d.serves(item.serves)}</span>
            {item.today > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson/20 px-3 py-1.5 text-rose"><Flame size={13} /> {d.orderedTonight(item.today)}</span>}
            {tagLabels.map((l) => <span key={l} className="rounded-full border border-gold/15 px-3 py-1.5">{l}</span>)}
            <TagIcons item={item} />
          </div>
          {desc && <p className="mt-5 text-[15px] leading-relaxed text-champagne/85">{desc}</p>}

          {item.options.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">{d.choose}</div>
              <div className="flex flex-wrap gap-2">
                {item.options.map((o) => (
                  <button key={o.id} onClick={() => setOptionId(o.id)}
                    className={`rounded-full px-4 py-2 text-sm transition ${optionId === o.id ? "bg-gold text-ink" : "border border-gold/25 text-champagne"}`}>
                    {loc(o, "name", lang)}{o.priceDelta ? ` +${price(o.priceDelta)}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {table && item.available && (
            <>
              <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 140))} placeholder={d.note} rows={2}
                className="mt-6 w-full resize-none rounded-2xl border border-gold/15 bg-black/30 px-4 py-3 text-sm text-champagne placeholder:text-smoke outline-none focus:border-gold/50" />
              <div className="mt-5 flex items-center gap-3">
                <div className="flex items-center rounded-full border border-gold/25">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center text-gold" aria-label="-"><Minus size={18} /></button>
                  <span className="w-6 text-center tabular-nums">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(30, q + 1))} className="grid h-12 w-12 place-items-center text-gold" aria-label="+"><Plus size={18} /></button>
                </div>
                <button onClick={add} disabled={busy} className="btn-gold flex-1 rounded-full py-3.5 text-[15px] disabled:opacity-60">
                  {d.addToTable} · <span className="tabular-nums">{price(unit * qty)}</span>
                </button>
              </div>
              {data.settings.giftsEnabled && GIFTABLE.has(item.role) && (
                <button onClick={() => { openItem(null); onGift(item.id); }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose/40 py-3 text-sm text-rose hover:bg-rose/10">
                  <Gift size={16} /> {d.gift}
                </button>
              )}
            </>
          )}
          {!item.available && <div className="mt-6 rounded-2xl bg-white/5 p-4 text-center text-sm text-mist">{d.unavailable}</div>}
          {!table && item.available && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/15 bg-white/[0.03] p-4 text-sm text-mist">
              <QrCode className="shrink-0 text-gold" size={22} /> {d.scanToOrder}
            </div>
          )}

          {pairings.length > 0 && (
            <div className="mt-8">
              <div className="hairline mb-5" />
              <div className="mb-3 font-display text-xl text-gold">{d.pairsWith}</div>
              <div className="-mx-6 flex gap-3 overflow-x-auto px-6 no-scrollbar">
                {pairings.map((p) => (
                  <button key={p.id} onClick={() => openItem(p.id)} className="w-36 shrink-0 text-start">
                    <Img src={p.image} alt={loc(p, "name", lang)} label={loc(p, "name", lang).slice(0, 1)} className="aspect-square w-full rounded-2xl" />
                    <div className="mt-2 line-clamp-1 text-sm text-champagne">{loc(p, "name", lang)}</div>
                    <div className="text-xs text-gold tabular-nums">{price(p.price)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
