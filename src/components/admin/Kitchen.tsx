"use client";
import { ArrowRight, Clock, Maximize2, X } from "lucide-react";
import { PageTitle, useLive } from "./AdminShell";
import { ago, api } from "./fmt";

const COLS = [
  { key: "new", title: "New", next: "preparing", cta: "Start", tone: "border-rose/50" },
  { key: "preparing", title: "Preparing", next: "ready", cta: "Ready", tone: "border-gold/50" },
  { key: "ready", title: "Ready to serve", next: "served", cta: "Served", tone: "border-emerald-400/50" },
] as const;

export function Kitchen() {
  const { live, refresh, now } = useLive();
  const move = async (id: string, status: string) => { await api(`/api/admin/orders/${id}`, "PATCH", { status }).catch(() => {}); await refresh(); };
  const orders = live?.orders ?? [];
  return (
    <div>
      <PageTitle title="Kitchen" sub="Orders flow in live from every table. Tap to move them along — guests see each step on their phone."
        right={<button onClick={() => document.documentElement.requestFullscreen?.()} className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm text-mist"><Maximize2 size={15} /> Full screen</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((c) => {
          const list = orders.filter((o) => o.status === c.key);
          return (
            <div key={c.key} className="panel min-h-[60vh] p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl">{c.title}</h2>
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white/5 px-2 text-sm">{list.length}</span>
              </div>
              <div className="space-y-3">
                {list.map((o) => {
                  const mins = (now - new Date(o.createdAt).getTime()) / 60000;
                  const late = mins > 20 && c.key !== "ready";
                  return (
                    <div key={o.id} className={`rounded-2xl border-2 ${c.tone} bg-black/30 p-4 animate-fade`}>
                      <div className="flex items-center justify-between">
                        <div className="font-display text-3xl leading-none">T{o.table}</div>
                        <div className={`flex items-center gap-1 text-sm ${late ? "text-rose" : "text-mist"}`}><Clock size={14} /> {ago(o.createdAt, now)}</div>
                      </div>
                      <div className="mt-1 text-xs text-smoke">#{o.number}{o.isGift ? " · 🌹 GIFT — deliver with the card" : ""}</div>
                      <ul className="mt-3 space-y-1.5">
                        {o.lines.map((l) => (
                          <li key={l.id} className="text-[15px]">
                            <span className="me-2 inline-grid h-6 min-w-6 place-items-center rounded-md bg-gold/15 px-1 text-sm text-gold">{l.qty}</span>
                            {l.nameEn} <span className="text-smoke" dir="rtl">· {l.nameAr}</span>
                            {l.optionName && <div className="ms-8 text-xs text-gold/80">{l.optionName}</div>}
                            {l.note && <div className="ms-8 text-xs italic text-rose/90">“{l.note}”</div>}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex gap-2">
                        <button onClick={() => move(o.id, c.next)} className="btn-gold inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm">{c.cta} <ArrowRight size={15} /></button>
                        {c.key === "new" && <button onClick={() => confirm("Cancel this order?") && move(o.id, "cancelled")} className="grid w-11 place-items-center rounded-xl border border-line text-mist" aria-label="Cancel"><X size={15} /></button>}
                      </div>
                    </div>
                  );
                })}
                {list.length === 0 && <p className="py-10 text-center text-sm text-smoke">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
