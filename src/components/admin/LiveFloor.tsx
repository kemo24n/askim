"use client";
import { useMemo, useState } from "react";
import { Check, Clock, Gift, Heart, Users, X, ExternalLink, DoorClosed, ChefHat, Receipt } from "lucide-react";
import type { LiveData } from "@/lib/admin-data";
import { PageTitle, useLive } from "./AdminShell";
import { ago, api, REQ_EMOJI, REQ_LABEL, syp, usd } from "./fmt";

type TableRow = LiveData["tables"][number];

export function LiveFloor() {
  const { live, refresh, rateUSD, now } = useLive();
  const [openTable, setOpenTable] = useState<TableRow | null>(null);
  const zones = useMemo(() => {
    const map = new Map<string, TableRow[]>();
    for (const t of live?.tables ?? []) { if (!t.active) continue; map.set(t.zone, [...(map.get(t.zone) ?? []), t]); }
    return [...map.entries()];
  }, [live]);

  if (!live) return <Skeleton />;
  const k = live.kpis;
  const act = async (fn: () => Promise<unknown>) => { await fn().catch(() => {}); await refresh(); };
  const selected = openTable ? live.tables.find((t) => t.id === openTable.id) ?? null : null;

  return (
    <div>
      <PageTitle title="Live floor" sub={`Updated live · ${new Date(live.now).toLocaleTimeString("en-GB", { timeZone: "Asia/Damascus", hour: "2-digit", minute: "2-digit" })} Damascus`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Revenue today" value={syp(k.revenue)} hint={`≈ ${usd(k.revenue, rateUSD)}`} accent />
        <Kpi label="Orders today" value={String(k.orders)} hint={`${k.activeOrders} in progress`} />
        <Kpi label="Tables seated" value={`${k.seated}/${k.tables}`} hint={`${k.guests} guests on the app`} />
        <Kpi label="Needs attention" value={String(k.openRequests + live.gifts.length)} hint={`${k.openRequests} requests · ${live.gifts.length} gifts`} alert={k.openRequests + live.gifts.length > 0} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Floor map */}
        <div className="panel p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-mist">
            <Legend c="bg-white/10" l="Free" /><Legend c="bg-emerald-400" l="Seated" /><Legend c="bg-gold" l="Ordering" /><Legend c="bg-rose" l="Needs you" />
          </div>
          <div className="space-y-6">
            {zones.map(([zone, tables]) => (
              <div key={zone}>
                <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-smoke">{zone}</div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                  {tables.map((t) => {
                    const needs = t.requests.length > 0;
                    const ordering = (t.session?.cartQty ?? 0) > 0 || t.activeOrders > 0;
                    const state = !t.session ? "free" : needs ? "needs" : ordering ? "ordering" : "seated";
                    const ring = { free: "border-line/70", seated: "border-emerald-400/50", ordering: "border-gold/70", needs: "border-rose animate-pulse" }[state];
                    return (
                      <button key={t.id} onClick={() => setOpenTable(t)}
                        className={`relative aspect-square rounded-2xl border-2 ${ring} ${t.session ? "bg-white/[0.04]" : "bg-transparent"} p-2 text-start transition hover:bg-white/[0.07]`}>
                        <div className="font-display text-3xl leading-none text-champagne">{t.number}</div>
                        {!t.session && <div className="mt-1 text-[10px] text-smoke">{t.seats} seats</div>}
                        {t.session && (
                          <div className="absolute inset-x-2 bottom-2">
                            <div className="flex -space-x-1.5">
                              {t.session.guests.slice(0, 4).map((g) => <span key={g.id} className="h-4 w-4 rounded-full ring-2 ring-noir" style={{ background: g.color }} />)}
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-mist">
                              <span>{ago(t.session.since, now)}</span>
                              {t.requests[0] && <span>{REQ_EMOJI[t.requests[0]]}</span>}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-2xl">Requests</h2>
              <span className="text-xs text-smoke">{live.requests.length} open</span>
            </div>
            {live.requests.length === 0 && <Empty text="All calm. No one is waiting." />}
            <ul className="space-y-2">
              {live.requests.map((r) => (
                <li key={r.id} className={`flex items-center gap-3 rounded-xl p-3 ${r.status === "open" ? "bg-rose/10 ring-1 ring-rose/30" : "bg-white/[0.03]"}`}>
                  <span className="text-2xl">{REQ_EMOJI[r.type]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm"><b className="text-champagne">Table {r.table}</b> · {REQ_LABEL[r.type]}</div>
                    <div className="flex items-center gap-1 text-[11px] text-smoke"><Clock size={11} /> {ago(r.createdAt, now)} {r.status === "ack" && "· on it"}</div>
                  </div>
                  {r.status === "open" && <button onClick={() => act(() => api(`/api/admin/requests/${r.id}`, "PATCH", { status: "ack" }))} className="rounded-lg bg-white/5 px-3 py-1.5 text-xs">On it</button>}
                  <button onClick={() => act(() => api(`/api/admin/requests/${r.id}`, "PATCH", { status: "done" }))} className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300" aria-label="Done"><Check size={15} /></button>
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-2xl"><Heart size={18} className="text-rose" fill="currentColor" /> Gifts to approve</h2>
              <span className="text-xs text-smoke">{live.gifts.length}</span>
            </div>
            {live.gifts.length === 0 && <Empty text="No gifts waiting." />}
            <ul className="space-y-3">
              {live.gifts.map((g) => (
                <li key={g.id} className="rounded-xl border border-rose/25 bg-rose/[0.06] p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Gift size={15} className="text-rose" />
                    <span>Table <b>{g.from}</b> → Table <b>{g.to}</b></span>
                    <span className="ms-auto text-[11px] text-smoke">{ago(g.createdAt, now)}</span>
                  </div>
                  <div className="mt-1 text-sm text-champagne">{g.itemEn} · <span className="text-smoke" dir="rtl">{g.itemAr}</span> · <span className="text-gold">{syp(g.price)}</span></div>
                  {g.message && <p className="mt-2 rounded-lg bg-black/30 p-2 font-display text-lg italic">“{g.message}”</p>}
                  <div className="mt-1 text-[11px] text-smoke">{g.sender ? `Signed: ${g.sender}` : "Anonymous"}</div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => act(() => api(`/api/admin/gifts/${g.id}`, "PATCH", { status: "approved" }))} className="btn-gold flex-1 rounded-lg py-2 text-sm">Approve & send to kitchen</button>
                    <button onClick={() => act(() => api(`/api/admin/gifts/${g.id}`, "PATCH", { status: "declined" }))} className="rounded-lg border border-line px-3 text-sm text-mist">Decline</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {selected && <TableDrawer t={selected} onClose={() => setOpenTable(null)} />}
    </div>
  );
}

function TableDrawer({ t, onClose }: { t: TableRow; onClose: () => void }) {
  const { live, refresh, rateUSD, now } = useLive();
  const orders = live?.orders.filter((o) => o.table === t.number) ?? [];
  const close = async () => {
    if (!t.session || !confirm(`Close table ${t.number}? Guests will be signed out.`)) return;
    await api(`/api/admin/sessions/${t.session.id}`, "DELETE").catch(() => {});
    await refresh(); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
      <button className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-s border-line bg-noir p-6 animate-fade">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-smoke">{t.zone} · {t.seats} seats</div>
            <h2 className="font-display text-5xl">Table {t.number}</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/5"><X size={16} /></button>
        </div>
        {!t.session ? (
          <div className="mt-8 rounded-2xl bg-white/[0.03] p-6 text-center text-mist">
            Table is free.
            <a href={`/ar/t/${t.token}`} target="_blank" className="mt-4 flex items-center justify-center gap-2 text-sm text-gold"><ExternalLink size={14} /> Open as a guest</a>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <Mini icon={<Users size={15} />} label="Guests" value={String(t.session.guests.length)} />
              <Mini icon={<Clock size={15} />} label="Seated" value={ago(t.session.since, now)} />
              <Mini icon={<Receipt size={15} />} label="Bill" value={usd(t.session.total, rateUSD)} />
            </div>
            <div className="mt-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">At the table</div>
              <div className="flex flex-wrap gap-2">
                {t.session.guests.map((g) => (
                  <span key={g.id} className="inline-flex items-center gap-2 rounded-full bg-white/5 py-1 pe-3 ps-1 text-sm">
                    <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-ink" style={{ background: g.color }}>{g.name[0]}</span>{g.name}
                  </span>
                ))}
              </div>
              {t.session.cartQty > 0 && <p className="mt-3 text-sm text-gold">Building an order right now · {t.session.cartQty} items in their cart</p>}
            </div>
            <div className="mt-6">
              <div className="mb-2 text-xs uppercase tracking-[0.2em] text-smoke">Active orders</div>
              {orders.length === 0 && <Empty text="Nothing in the kitchen." />}
              {orders.map((o) => (
                <div key={o.id} className="mb-2 rounded-xl bg-white/[0.03] p-3 text-sm">
                  <div className="flex justify-between"><span>#{o.number} {o.isGift && "🌹"}</span><span className="text-gold capitalize">{o.status}</span></div>
                  <ul className="mt-1 text-mist">{o.lines.map((l) => <li key={l.id}>{l.qty}× {l.nameEn}</li>)}</ul>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-gold/20 p-4">
              <div className="flex items-center justify-between"><span className="text-mist">Session total</span><span className="text-2xl text-gold">{syp(t.session.total)}</span></div>
              <div className="text-end text-xs text-smoke">≈ {usd(t.session.total, rateUSD)}</div>
            </div>
            <div className="mt-6 grid gap-2">
              <a href="/admin/kitchen" className="flex items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm"><ChefHat size={15} /> Open kitchen board</a>
              <button onClick={close} className="flex items-center justify-center gap-2 rounded-xl border border-rose/40 py-3 text-sm text-rose"><DoorClosed size={15} /> Paid & closed — free the table</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, accent, alert }: { label: string; value: string; hint?: string; accent?: boolean; alert?: boolean }) {
  return (
    <div className={`panel p-4 ${alert ? "!border-rose/50" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.2em] text-smoke">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums lg:text-3xl ${accent ? "text-gold" : alert ? "text-rose" : "text-champagne"}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-mist">{hint}</div>}
    </div>
  );
}
function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl bg-white/[0.03] p-3"><div className="flex justify-center text-gold">{icon}</div><div className="mt-1 text-lg">{value}</div><div className="text-[10px] text-smoke">{label}</div></div>;
}
function Legend({ c, l }: { c: string; l: string }) { return <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${c}`} />{l}</span>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl bg-white/[0.02] p-4 text-center text-sm text-smoke">{text}</p>; }
function Skeleton() { return <div className="grid gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="panel h-28 animate-pulse" />)}</div>; }
