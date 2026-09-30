"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Bell, Check, ChefHat, Droplets, Flame, Gift, Heart, Minus, Plus, Receipt, Sparkles, Star, Wind, Eraser,
} from "lucide-react";
import { loc } from "@/lib/i18n";
import { CURRENCIES, currencyLabel, formatMoney } from "@/lib/money";
import { Img } from "@/components/ui/Img";
import { Sheet } from "@/components/ui/Sheet";
import { useMenu } from "./context";

function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-ink ring-2 ring-noir" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
export { Avatar };

const STATUS_STEPS = ["new", "preparing", "ready", "served"] as const;

export function CartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, lang, state, table, itemsById, price, setQty, submitOrder, data } = useMenu();
  const [tab, setTab] = useState<"cart" | "bill">("cart");
  const [busy, setBusy] = useState(false);
  const guests = state?.guests ?? [];
  const cart = state?.cart ?? [];
  const orders = (state?.orders ?? []).filter((o) => o.status !== "cancelled");
  const cartTotal = cart.reduce((a, c) => {
    const it = itemsById.get(c.itemId);
    const op = it?.options.find((o) => o.id === c.optionId);
    return a + ((it?.price ?? 0) + (op?.priceDelta ?? 0)) * c.qty;
  }, 0);

  const bill = useMemo(() => {
    const per = new Map<string, number>();
    let total = 0;
    let gifts = 0;
    for (const o of orders) {
      for (const l of o.lines) {
        const v = l.unitPrice * l.qty;
        total += v;
        if (o.isGift) gifts += v;
        const k = l.guestId ?? "table";
        per.set(k, (per.get(k) ?? 0) + v);
      }
    }
    const fee = Math.round(total * (data.settings.serviceFeePct / 100));
    return { per, total, fee, gifts };
  }, [orders, data.settings.serviceFeePct]);

  useEffect(() => { if (open) setTab(cart.length || !orders.length ? "cart" : "bill"); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!table) return null;
  const byGuest = guests.map((g) => ({ g, lines: cart.filter((c) => c.guestId === g.id) })).filter((x) => x.lines.length);

  const send = async () => { setBusy(true); const okd = await submitOrder(); setBusy(false); if (okd) setTab("bill"); };

  return (
    <Sheet open={open} onClose={onClose} labelClose={d.close} tall
      title={
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-2xl text-champagne">{d.table} {table.tableNumber}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{d.liveTable}</span>
          </div>
          <div className="mt-2 flex -space-x-2 rtl:space-x-reverse">
            {guests.map((g) => <Avatar key={g.id} name={g.name} color={g.color} size={26} />)}
            <span className="ms-4 self-center text-xs text-mist">{d.guestsHere(guests.length)}</span>
          </div>
        </div>
      }>
      <div className="px-5 pb-8">
        <div className="mb-5 grid grid-cols-2 rounded-full bg-white/5 p-1 text-sm">
          {(["cart", "bill"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full py-2.5 transition ${tab === k ? "bg-gold text-ink" : "text-mist"}`}>
              {k === "cart" ? `${d.tableCart}${cart.length ? ` · ${cart.reduce((a, c) => a + c.qty, 0)}` : ""}` : `${d.orders}${orders.length ? ` · ${orders.length}` : ""}`}
            </button>
          ))}
        </div>

        {tab === "cart" && (
          <>
            {!cart.length && <p className="py-12 text-center text-mist">{d.emptyCart}</p>}
            <div className="space-y-6">
              {byGuest.map(({ g, lines }) => (
                <div key={g.id}>
                  <div className="mb-2 flex items-center gap-2 text-sm">
                    <Avatar name={g.name} color={g.color} size={22} />
                    <span className="text-champagne">{g.name}</span>
                    {g.id === table.guestId && <span className="text-xs text-smoke">({d.you})</span>}
                  </div>
                  <ul className="space-y-2">
                    {lines.map((c) => {
                      const it = itemsById.get(c.itemId);
                      if (!it) return null;
                      const op = it.options.find((o) => o.id === c.optionId);
                      const mine = c.guestId === table.guestId;
                      return (
                        <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-2">
                          <Img src={it.image} alt="" label={loc(it, "name", lang).slice(0, 1)} className="h-12 w-12 shrink-0 rounded-xl" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-champagne">{loc(it, "name", lang)}{op ? ` · ${loc(op, "name", lang)}` : ""}</div>
                            {c.note && <div className="truncate text-xs text-smoke">“{c.note}”</div>}
                            <div className="text-xs text-gold tabular-nums">{price((it.price + (op?.priceDelta ?? 0)) * c.qty)}</div>
                          </div>
                          {mine ? (
                            <div className="flex items-center rounded-full border border-gold/20">
                              <button onClick={() => setQty(c.id, c.qty - 1)} className="grid h-8 w-8 place-items-center text-gold"><Minus size={14} /></button>
                              <span className="w-5 text-center text-sm tabular-nums">{c.qty}</span>
                              <button onClick={() => setQty(c.id, c.qty + 1)} className="grid h-8 w-8 place-items-center text-gold"><Plus size={14} /></button>
                            </div>
                          ) : <span className="px-3 text-sm text-mist tabular-nums">×{c.qty}</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="sticky bottom-0 -mx-5 mt-6 bg-gradient-to-t from-noir via-noir to-noir/0 px-5 pb-2 pt-6">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-mist">{d.total}</span>
                  <span className="text-xl text-gold tabular-nums">{price(cartTotal)}</span>
                </div>
                <button onClick={send} disabled={busy} className="btn-gold inline-flex w-full items-center justify-center gap-2 rounded-full py-4 disabled:opacity-60">
                  <ChefHat size={18} /> {busy ? d.sending : d.sendToKitchen}
                </button>
              </div>
            )}
          </>
        )}

        {tab === "bill" && (
          <div className="space-y-5">
            {!orders.length && <p className="py-12 text-center text-mist">{d.emptyCart}</p>}
            {orders.map((o) => {
              const stepIdx = STATUS_STEPS.indexOf(o.status as (typeof STATUS_STEPS)[number]);
              return (
                <div key={o.id} className="card-lux rounded-3xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-mist">#{o.number}{o.isGift ? ` · 🌹 ${d.gift}` : ""}</span>
                    <span className="text-sm text-gold">{d.status[o.status as keyof typeof d.status]}</span>
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    {STATUS_STEPS.map((s, i) => <div key={s} className={`h-1 flex-1 rounded-full ${i <= stepIdx ? "bg-gold" : "bg-white/10"} ${i === stepIdx && o.status !== "served" ? "animate-pulse" : ""}`} />)}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm">
                    {o.lines.map((l) => (
                      <li key={l.id} className="flex justify-between gap-3 text-champagne/85">
                        <span className="truncate">{l.qty}× {lang === "ar" ? l.nameAr : l.nameEn}</span>
                        <span className="tabular-nums text-mist">{price(l.unitPrice * l.qty)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            {orders.length > 0 && (
              <div className="rounded-3xl border border-gold/20 p-5">
                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-smoke">{d.splitBill}</div>
                <ul className="space-y-2">
                  {guests.map((g) => {
                    const v = bill.per.get(g.id) ?? 0;
                    if (!v) return null;
                    const share = v + Math.round(v * (data.settings.serviceFeePct / 100));
                    return (
                      <li key={g.id} className="flex items-center gap-3">
                        <Avatar name={g.name} color={g.color} size={24} />
                        <span className="flex-1 text-champagne">{g.name}{g.id === table.guestId ? ` · ${d.yourShare}` : ""}</span>
                        <span className="tabular-nums text-gold">{price(share)}</span>
                      </li>
                    );
                  })}
                </ul>
                <div className="hairline my-4" />
                {bill.fee > 0 && <div className="flex justify-between text-sm text-mist"><span>{d.service} {data.settings.serviceFeePct}%</span><span className="tabular-nums">{price(bill.fee)}</span></div>}
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-mist">{d.total}</span>
                  <span className="text-3xl font-medium text-gold-2 tabular-nums">{price(bill.total + bill.fee)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 text-[11px] text-smoke tabular-nums">
                  {(["USD", "EUR", "TRY"] as const).map((c) => <span key={c}>≈ {formatMoney(bill.total + bill.fee, c, data.settings.rates, lang)}</span>)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}

const SERVICES = [
  { type: "waiter", icon: Bell },
  { type: "bill", icon: Receipt },
  { type: "coal", icon: Flame },
  { type: "water", icon: Droplets },
  { type: "napkins", icon: Wind },
  { type: "clean", icon: Eraser },
] as const;

export function ServiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, state, requestService } = useMenu();
  const pending = new Set((state?.requests ?? []).map((r) => r.type));
  return (
    <Sheet open={open} onClose={onClose} labelClose={d.close} title={<span className="font-display text-2xl text-champagne">{d.services}</span>}>
      <div className="grid grid-cols-3 gap-3 px-5 pb-8">
        {SERVICES.map(({ type, icon: Icon }) => {
          const on = pending.has(type);
          return (
            <button key={type} onClick={() => !on && requestService(type)}
              className={`card-lux flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl p-3 text-center transition active:scale-95 ${on ? "ring-gold" : ""}`}>
              <span className={`grid h-12 w-12 place-items-center rounded-full ${on ? "bg-gold text-ink animate-pulse-ring" : "bg-white/5 text-gold"}`}>
                {on ? <Check size={20} /> : <Icon size={20} />}
              </span>
              <span className="text-[13px] leading-tight text-champagne">{d.req[type]}</span>
              {on && <span className="-mt-2 text-[10px] text-gold">{d.reqPending}</span>}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

export function GiftSheet({ open, onClose, preset }: { open: boolean; onClose: () => void; preset: number | null }) {
  const { d, lang, data, price, sendGift, table } = useMenu();
  const [tables, setTables] = useState<{ number: number; zone: string }[] | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [itemId, setItemId] = useState<number | null>(preset);
  const [msg, setMsg] = useState("");
  const [anon, setAnon] = useState(true);
  const [sender, setSender] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItemId(preset); setTo(null); setMsg(""); setAnon(true); setSender(table?.guestName ?? "");
    fetch("/api/table/occupied").then((r) => (r.ok ? r.json() : [])).then(setTables).catch(() => setTables([]));
  }, [open, preset, table?.guestName]);

  const giftables = useMemo(() => {
    const ids = [216683, 216681, 216692, 216690, 216689, 216672, 216623, 216626, 234089, 216628, 216653, 216685];
    const list = ids.map((id) => data.items.find((i) => i.id === id)).filter((x): x is NonNullable<typeof x> => !!x && x.available);
    if (preset && !list.find((x) => x.id === preset)) {
      const p = data.items.find((i) => i.id === preset);
      if (p) list.unshift(p);
    }
    return list;
  }, [data.items, preset]);

  const send = async () => {
    if (!to || !itemId) return;
    setBusy(true);
    const okd = await sendGift({ toTableNumber: to, itemId, message: msg.trim() || undefined, anonymous: anon, senderName: anon ? undefined : sender.trim() || undefined });
    setBusy(false);
    if (okd) onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} labelClose={d.close} tall
      title={<div className="flex items-center gap-2"><Heart className="text-rose" size={20} fill="currentColor" /><span className="font-display text-2xl text-champagne">{d.gift}</span></div>}>
      <div className="px-5 pb-8">
        <p className="-mt-1 text-sm text-mist">{d.giftSub}</p>

        <div className="mt-6 mb-2 text-xs uppercase tracking-[0.2em] text-smoke">{d.giftTo}</div>
        {tables === null ? (
          <div className="h-12 animate-pulse rounded-2xl bg-white/5" />
        ) : tables.length === 0 ? (
          <p className="rounded-2xl bg-white/5 p-4 text-center text-sm text-mist">{d.giftNoTables}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tables.map((tb) => (
              <button key={tb.number} onClick={() => setTo(tb.number)}
                className={`min-w-14 rounded-2xl px-4 py-3 text-center transition ${to === tb.number ? "bg-rose text-white" : "border border-gold/20 text-champagne"}`}>
                <div className="font-display text-xl leading-none tabular-nums">{tb.number}</div>
                <div className="mt-1 text-[10px] opacity-70">{tb.zone}</div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 mb-2 text-xs uppercase tracking-[0.2em] text-smoke">{d.giftPick}</div>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {giftables.map((g) => (
            <button key={g.id} onClick={() => setItemId(g.id)} className={`w-32 shrink-0 rounded-2xl p-1.5 text-start transition ${itemId === g.id ? "bg-rose/15 ring-1 ring-rose" : ""}`}>
              <Img src={g.image} alt="" label={loc(g, "name", lang).slice(0, 1)} className="aspect-square w-full rounded-xl" />
              <div className="mt-1.5 line-clamp-1 px-1 text-xs text-champagne">{loc(g, "name", lang)}</div>
              <div className="px-1 text-[11px] text-gold tabular-nums">{price(g.price)}</div>
            </button>
          ))}
        </div>

        <div className="mt-6 mb-2 text-xs uppercase tracking-[0.2em] text-smoke">{d.giftMsg}</div>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 160))} rows={3} placeholder={d.giftMsgPh}
          className="w-full resize-none rounded-2xl border border-rose/25 bg-black/30 px-4 py-3 font-display text-lg text-champagne placeholder:text-smoke outline-none focus:border-rose/60" />
        <label className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.03] px-4 py-3 text-sm">
          <span>{d.giftAnon}</span>
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="h-5 w-5 accent-[#d4545b]" />
        </label>
        {!anon && (
          <input value={sender} onChange={(e) => setSender(e.target.value.slice(0, 30))} placeholder={d.giftFromName}
            className="mt-3 w-full rounded-2xl border border-gold/20 bg-black/30 px-4 py-3 text-sm outline-none focus:border-gold/60" />
        )}
        <p className="mt-3 text-center text-[11px] text-smoke">{d.giftAddedToBill}</p>
        <button onClick={send} disabled={!to || !itemId || busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-crimson to-rose py-4 font-medium text-white shadow-[0_12px_30px_-10px_rgba(212,84,91,0.7)] disabled:opacity-40">
          <Gift size={18} /> {d.giftSend}
        </button>
      </div>
    </Sheet>
  );
}

/** Full-screen moment when another table sends you a gift. */
export function GiftArrival() {
  const { state, d, lang, itemsById, markGiftSeen } = useMenu();
  const gift = state?.giftsIn.find((g) => !g.seen && (g.status === "approved" || g.status === "delivered"));
  if (!gift) return null;
  const item = itemsById.get(gift.itemId);
  const petals = Array.from({ length: 22 });
  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center overflow-hidden bg-black/80 p-6 backdrop-blur-md animate-fade">
      {petals.map((_, i) => (
        <span key={i} className="pointer-events-none absolute top-0 animate-petal text-rose"
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.7}s`, fontSize: 14 + (i % 4) * 6, ["--drift" as string]: `${(i % 2 ? 1 : -1) * (30 + (i % 5) * 20)}px` }}>
          ❤
        </span>
      ))}
      <div className="relative w-full max-w-sm rounded-[32px] border border-rose/30 bg-noir p-7 text-center shadow-[0_30px_80px_-20px_rgba(212,84,91,0.5)] animate-rise">
        <Sparkles className="mx-auto text-gold animate-float" />
        <div className="mt-3 font-display text-4xl text-champagne">{d.giftArrived}</div>
        {item && <Img src={item.image} alt="" label="🌹" className="mx-auto mt-5 aspect-square w-40 rounded-3xl ring-1 ring-rose/30" />}
        {item && <div className="mt-3 font-display text-2xl text-gold">{loc(item, "name", lang)}</div>}
        {gift.message && <p className="mt-4 font-display text-xl italic leading-snug text-champagne/90">“{gift.message}”</p>}
        <div className="mt-3 text-sm text-rose">{gift.senderName ? d.giftFrom(gift.senderName) : d.giftSecret}</div>
        <button onClick={() => markGiftSeen(gift.id)} className="btn-gold mt-7 w-full rounded-full py-3.5">
          <Heart size={16} className="me-2 inline" fill="currentColor" /> {lang === "ar" ? "شكراً من القلب" : "Thank you, truly"}
        </button>
      </div>
    </div>
  );
}

export function CurrencySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, lang, currency, setCurrency, data } = useMenu();
  return (
    <Sheet open={open} onClose={onClose} labelClose={d.close} title={<span className="font-display text-2xl text-champagne">{d.currency}</span>}>
      <div className="grid gap-2 px-5 pb-8">
        {CURRENCIES.map((c) => (
          <button key={c} onClick={() => { setCurrency(c); onClose(); }}
            className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition ${currency === c ? "border-gold bg-gold/10" : "border-gold/15"}`}>
            <span className="text-champagne">{currencyLabel(c, lang)}</span>
            <span className="text-sm text-mist tabular-nums">{formatMoney(1650, c, data.settings.rates, lang)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function FeedbackSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d } = useMenu();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const submit = async () => {
    await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ stars, comment }) });
    setDone(true);
  };
  return (
    <Sheet open={open} onClose={() => { onClose(); setTimeout(() => { setDone(false); setStars(0); setComment(""); }, 300); }} labelClose={d.close}
      title={<span className="font-display text-2xl text-champagne">{d.feedback}</span>}>
      <div className="px-5 pb-8">
        {done ? (
          <p className="py-10 text-center font-display text-2xl text-gold animate-rise">{d.feedbackThanks}</p>
        ) : (
          <>
            <div className="flex justify-center gap-2 py-4" dir="ltr">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setStars(n)} aria-label={`${n}`} className="p-1 transition active:scale-90">
                  <Star size={36} className={n <= stars ? "text-gold" : "text-white/15"} fill="currentColor" />
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder={d.feedbackPh}
              className="w-full resize-none rounded-2xl border border-gold/15 bg-black/30 px-4 py-3 text-sm outline-none focus:border-gold/50" />
            <button disabled={!stars} onClick={submit} className="btn-gold mt-4 w-full rounded-full py-3.5 disabled:opacity-40">{d.submit}</button>
          </>
        )}
      </div>
    </Sheet>
  );
}
