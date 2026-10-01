"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChefHat, ExternalLink, LayoutDashboard, LineChart, LogOut, QrCode, Settings, UtensilsCrossed, Volume2, VolumeX } from "lucide-react";
import type { LiveData } from "@/lib/admin-data";
import { Logo } from "@/components/guest/Logo";

type Ctx = { live: LiveData | null; refresh: () => Promise<void>; rateUSD: number; now: number };
const LiveCtx = createContext<Ctx>({ live: null, refresh: async () => {}, rateUSD: 110, now: Date.now() });
export const useLive = () => useContext(LiveCtx);

const NAV = [
  { href: "/admin", label: "Live floor", icon: LayoutDashboard },
  { href: "/admin/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tables", label: "Tables & QR", icon: QrCode },
  { href: "/admin/insights", label: "Insights", icon: LineChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.16 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.5);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + i * 0.16); o.stop(ctx.currentTime + i * 0.16 + 0.55);
    });
  } catch { /* audio blocked */ }
}

export function AdminShell({ children, rateUSD }: { children: React.ReactNode; rateUSD: number }) {
  const path = usePathname();
  const router = useRouter();
  const [live, setLive] = useState<LiveData | null>(null);
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(true);
  const seen = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/live", { cache: "no-store" });
    if (res.status === 401) { router.replace("/admin/login"); return; }
    if (res.ok) setLive(await res.json());
  }, [router]);

  useEffect(() => {
    refresh();
    const iv = setInterval(() => { refresh(); setNow(Date.now()); }, 3000);
    return () => clearInterval(iv);
  }, [refresh]);

  // chime on anything new (orders, requests, gifts)
  useEffect(() => {
    if (!live) return;
    const ids = new Set([...live.orders.filter((o) => o.status === "new").map((o) => o.id), ...live.requests.map((r) => r.id), ...live.gifts.map((g) => g.id)]);
    if (seen.current) {
      const fresh = [...ids].some((id) => !seen.current!.has(id));
      if (fresh && sound) chime();
    }
    seen.current = ids;
  }, [live, sound]);

  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); router.replace("/admin/login"); };
  const alerts = (live?.kpis.openRequests ?? 0) + (live?.gifts.length ?? 0);

  return (
    <LiveCtx.Provider value={{ live, refresh, rateUSD, now }}>
      <div className="flex min-h-dvh">
        <aside className="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-e border-line/60 bg-noir/80 px-4 py-6 lg:flex">
          <div className="flex justify-center"><Logo size="sm" /></div>
          <div className="mt-1 px-2 text-center text-[10px] uppercase tracking-[0.4em] text-smoke">Control room</div>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return (
                <Link key={href} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${on ? "bg-gold/12 text-gold" : "text-mist hover:bg-white/5 hover:text-champagne"}`}>
                  <Icon size={17} /> {label}
                  {href === "/admin" && alerts > 0 && <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[10px] text-white">{alerts}</span>}
                  {href === "/admin/kitchen" && (live?.orders.filter((o) => o.status === "new").length ?? 0) > 0 && (
                    <span className="ms-auto grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10px] text-ink">{live!.orders.filter((o) => o.status === "new").length}</span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1 text-sm">
            <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-mist hover:bg-white/5"><ExternalLink size={16} /> Guest menu</a>
            <button onClick={() => setSound((x) => !x)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-mist hover:bg-white/5">{sound ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound {sound ? "on" : "off"}</button>
            <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-mist hover:bg-white/5"><LogOut size={16} /> Log out</button>
            <div className="mt-3 px-3 text-[10px] text-smoke">Built by <span className="text-gold/80">Solunera</span></div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {/* mobile nav */}
          <div className="no-print sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-line/60 bg-noir/90 px-3 py-2 backdrop-blur no-scrollbar lg:hidden">
            {NAV.map(({ href, label, icon: Icon }) => {
              const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
              return <Link key={href} href={href} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs ${on ? "bg-gold text-ink" : "text-mist"}`}><Icon size={14} />{label}</Link>;
            })}
          </div>
          <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">{children}</div>
        </div>
      </div>
    </LiveCtx.Provider>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl text-champagne">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mist">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
