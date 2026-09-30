"use client";
import { useState } from "react";
import Link from "next/link";
import { Eye, Lightbulb, Star, TrendingUp } from "lucide-react";
import type { Insights } from "@/lib/admin-data";
import { Img } from "@/components/ui/Img";
import { PageTitle, useLive } from "./AdminShell";
import { syp, usd } from "./fmt";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function InsightsView({ data }: { data: Insights }) {
  const { rateUSD } = useLive();
  return (
    <div>
      <PageTitle title="Insights" sub={`Last ${data.days} days · Damascus time`}
        right={
          <div className="flex rounded-xl border border-line p-1 text-sm">
            {[7, 14, 30].map((d) => (
              <Link key={d} href={`/admin/insights?days=${d}`} className={`rounded-lg px-4 py-1.5 ${data.days === d ? "bg-gold text-ink" : "text-mist"}`}>{d}d</Link>
            ))}
          </div>
        } />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Revenue" value={syp(data.totalRevenue)} hint={`≈ ${usd(data.totalRevenue, rateUSD)}`} gold />
        <Stat label="Orders" value={data.totalOrders.toLocaleString("en-US")} hint={`${Math.round(data.totalOrders / data.days)} per day`} />
        <Stat label="Average ticket" value={syp(data.avgTicket)} hint={`≈ ${usd(data.avgTicket, rateUSD)}`} />
        <Stat label="Guest rating" value={`${data.rating.avg || "—"} ★`} hint={`${data.rating.count} reviews`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="panel p-5">
          <h2 className="font-display text-2xl">Daily revenue</h2>
          <RevenueBars daily={data.daily} rateUSD={rateUSD} />
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-2xl">When guests order</h2>
          <p className="text-xs text-smoke">Orders by weekday and hour — darker is busier. Staff up where it glows.</p>
          <Heatmap cells={data.hourly} />
        </div>
      </div>

      <div className="mt-6 panel border-gold/30 p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-gold" size={20} />
          <h2 className="font-display text-2xl">Looked at, rarely ordered</h2>
        </div>
        <p className="mt-1 text-sm text-mist">Guests open these dishes a lot but don’t order them. Usually it’s the photo, the price, or the description. Fix one and watch the number move.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.gap.map((g) => (
            <div key={g.itemId} className="flex gap-3 rounded-2xl bg-white/[0.03] p-3">
              <Img src={g.image} alt="" className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-champagne">{g.nameEn}</div>
                <div className="truncate text-xs text-smoke" dir="rtl">{g.nameAr}</div>
                <div className="mt-1.5 flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-mist"><Eye size={12} /> {g.views}</span>
                  <span className="text-mist">{g.orders} orders</span>
                  <span className="ms-auto rounded-full bg-rose/15 px-2 py-0.5 text-rose">{(g.conversion * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
          {data.gap.length === 0 && <p className="text-sm text-smoke">Not enough views yet.</p>}
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="panel p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl"><TrendingUp size={18} className="text-gold" /> Best sellers</h2>
          <HBars rows={data.top.map((t) => ({ key: String(t.itemId), label: t.nameEn, sub: t.nameAr, value: t.revenue, note: `${t.qty} sold` }))} />
        </div>
        <div className="panel p-5">
          <h2 className="font-display text-2xl">Revenue by section</h2>
          <HBars rows={data.categories.slice(0, 12).map((c) => ({ key: String(c.id), label: c.nameEn, value: c.revenue }))} />
        </div>
      </div>

      <div className="mt-6 panel p-5">
        <h2 className="font-display text-2xl">What guests are saying</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.feedback.map((f) => (
            <figure key={f.id} className="rounded-2xl bg-white/[0.03] p-4">
              <div className="flex gap-0.5 text-gold" aria-label={`${f.stars} stars`}>{Array.from({ length: f.stars }).map((_, i) => <Star key={i} size={13} fill="currentColor" />)}</div>
              <blockquote className="mt-2 font-display text-lg leading-snug">“{f.comment}”</blockquote>
              <figcaption className="mt-2 text-[11px] text-smoke">{new Date(f.createdAt).toLocaleDateString("en-GB")}</figcaption>
            </figure>
          ))}
          {data.feedback.length === 0 && <p className="text-sm text-smoke">No written feedback yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, gold }: { label: string; value: string; hint?: string; gold?: boolean }) {
  return (
    <div className="panel p-4">
      <div className="text-[11px] uppercase tracking-[0.2em] text-smoke">{label}</div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums lg:text-3xl ${gold ? "text-gold" : ""}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-mist">{hint}</div>}
    </div>
  );
}

function RevenueBars({ daily, rateUSD }: { daily: Insights["daily"]; rateUSD: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const W = 700, H = 220, pad = 28;
  const bw = (W - pad) / Math.max(1, daily.length);
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <div className="relative mt-4">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Daily revenue bar chart">
        {ticks.map((t) => {
          const y = H - (t / max) * (H - 10);
          return <g key={t}><line x1={pad} x2={W} y1={y} y2={y} stroke="#2c221c" strokeWidth={1} /><text x={0} y={y + 3} fontSize={9} fill="#6f6258">{t >= 1000 ? `${Math.round(t / 1000)}k` : t}</text></g>;
        })}
        {daily.map((d, i) => {
          const h = Math.max(2, (d.revenue / max) * (H - 10));
          const x = pad + i * bw + 2;
          const w = Math.max(4, bw - 4);
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad + i * bw} y={0} width={bw} height={H} fill="transparent" />
              <path d={`M${x},${H} V${H - h + 4} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${H} Z`} fill={hover === i ? "#e2c98f" : "#c9a86a"} opacity={hover === null || hover === i ? 1 : 0.55} />
              {(i % Math.ceil(daily.length / 7) === 0 || i === daily.length - 1) && (
                <text x={x + w / 2} y={H + 16} fontSize={9} fill="#6f6258" textAnchor="middle">{d.day.slice(5)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && daily[hover] && (
        <div className="pointer-events-none absolute top-0 rounded-xl border border-line bg-noir px-3 py-2 text-xs shadow-xl"
          style={{ left: `${((pad + hover * bw + bw / 2) / W) * 100}%`, transform: "translateX(-50%)" }}>
          <div className="text-mist">{daily[hover].day}</div>
          <div className="text-champagne">{syp(daily[hover].revenue)}</div>
          <div className="text-smoke">≈ {usd(daily[hover].revenue, rateUSD)} · {daily[hover].orders} orders</div>
        </div>
      )}
    </div>
  );
}

function Heatmap({ cells }: { cells: Insights["hourly"] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...cells.map((c) => c.orders));
  const hours = Array.from({ length: 16 }, (_, i) => (i + 8) % 24); // 8:00 → 23:00
  const get = (dow: number, h: number) => cells.find((c) => c.dow === dow && c.hour === h)?.orders ?? 0;
  return (
    <div className="mt-4 overflow-x-auto">
      <div className="grid min-w-[420px] gap-[2px]" style={{ gridTemplateColumns: `32px repeat(${hours.length}, 1fr)` }}>
        <div />
        {hours.map((h) => <div key={h} className="pb-1 text-center text-[9px] text-smoke">{h % 3 === 0 ? h : ""}</div>)}
        {DOW.map((d, di) => (
          <div key={d} className="contents">
            <div className="flex items-center text-[10px] text-smoke">{d}</div>
            {hours.map((h) => {
              const v = get(di + 1, h);
              const k = `${di}-${h}`;
              return (
                <div key={k} onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)}
                  title={`${d} ${h}:00 · ${v} orders`}
                  className={`aspect-square rounded-[4px] ${hover === k ? "ring-1 ring-champagne" : ""}`}
                  style={{ background: v ? `rgba(201,168,106,${0.12 + 0.88 * (v / max)})` : "#1a1411" }} />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 h-4 text-xs text-mist">
        {hover && (() => { const [di, h] = hover.split("-").map(Number); return `${DOW[di]} ${h}:00 — ${get(di + 1, h)} orders`; })()}
      </div>
    </div>
  );
}

function HBars({ rows }: { rows: { key: string; label: string; sub?: string; value: number; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="mt-4 space-y-2.5">
      {rows.map((r) => (
        <li key={r.key} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-champagne">{r.label} {r.sub && <span className="text-smoke" dir="rtl">· {r.sub}</span>}</span>
            <span className="shrink-0 tabular-nums text-mist">{syp(r.value)}{r.note ? ` · ${r.note}` : ""}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-white/[0.04]">
            <div className="h-full rounded-full bg-gold transition-all group-hover:bg-gold-2" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
