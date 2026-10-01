"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, ExternalLink, Plus, Printer, QrCode, RefreshCw } from "lucide-react";
import { downloadCard, downloadQr } from "./qrCard";
import { PageTitle } from "./AdminShell";
import { api } from "./fmt";

type T = { id: number; number: number; zone: string; seats: number; token: string; active: boolean; url: string; svg: string };

export function TablesQR({ tables }: { tables: T[] }) {
  const router = useRouter();
  const [zone, setZone] = useState("Main hall");
  const [seats, setSeats] = useState(4);
  const [count, setCount] = useState(1);
  const [copied, setCopied] = useState<number | null>(null);
  const add = async () => { await api("/api/admin/tables", "POST", { zone, seats, count }); router.refresh(); };
  const regen = async (id: number) => {
    if (!confirm("Generate a new QR for this table? The old printed code will stop working.")) return;
    await api(`/api/admin/tables/${id}`, "PATCH", { regenerate: true }); router.refresh();
  };
  const toggle = async (t: T) => { await api(`/api/admin/tables/${t.id}`, "PATCH", { active: !t.active }); router.refresh(); };
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } finally { setBusy(null); } };
  const printOnly = (id: number | null) => {
    document.body.classList.toggle("print-one", id !== null);
    document.querySelectorAll(".qr-card-wrap").forEach((el) => el.classList.toggle("print-target", Number((el as HTMLElement).dataset.id) === id));
    setTimeout(() => { window.print(); document.body.classList.remove("print-one"); }, 50);
  };
  const downloadAll = () => run("all", async () => {
    for (const t of tables.filter((x) => x.active)) { await downloadCard(t); await new Promise((r) => setTimeout(r, 350)); }
  });
  const copy = async (t: T) => { await navigator.clipboard.writeText(t.url).catch(() => {}); setCopied(t.id); setTimeout(() => setCopied(null), 1500); };

  return (
    <div>
      <div className="no-print">
        <PageTitle title="Tables & QR codes" sub="Every table gets its own code. Guests who scan the same code share one live table."
          right={
            <div className="flex flex-wrap gap-2">
              <button onClick={downloadAll} disabled={busy === "all"} className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2.5 text-sm text-gold disabled:opacity-50"><Download size={15} /> {busy === "all" ? "Downloading…" : "Download all cards"}</button>
              <button onClick={() => printOnly(null)} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"><Printer size={15} /> Print all cards</button>
            </div>
          } />
        <div className="panel mb-6 flex flex-wrap items-end gap-3 p-4">
          <label className="flex flex-col gap-1 text-xs text-smoke">Zone<input value={zone} onChange={(e) => setZone(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-xs text-smoke">Seats<input type="number" className="w-20" value={seats} onChange={(e) => setSeats(Number(e.target.value))} /></label>
          <label className="flex flex-col gap-1 text-xs text-smoke">How many<input type="number" className="w-20" value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          <button onClick={add} className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2.5 text-sm text-gold"><Plus size={15} /> Add tables</button>
        </div>
      </div>

      <div className="qr-grid grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tables.map((t) => (
          <div key={t.id} data-id={t.id} className={`qr-card-wrap break-inside-avoid ${!t.active ? "opacity-40 print-hide" : ""}`}>
            {/* printable card */}
            <div className="qr-card relative overflow-hidden rounded-3xl bg-[#efe3c8] p-6 text-center text-[#1a120c]">
              <div className="absolute inset-3 rounded-[20px] border border-[#1a120c]/15" />
              <div className="relative">
                <div className="inline-flex flex-col items-center" dir="rtl">
                  <span className="font-callig text-4xl leading-tight">أشكم</span>
                  <span className="font-latin -mt-1 text-[10px] tracking-[0.6em]">AŞKIM</span>
                </div>
                <div className="mx-auto my-4 h-px w-24 bg-[#931d1e]/50" />
                <div className="font-latin text-5xl leading-none">{t.number}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.3em] opacity-60">{t.zone}</div>
                <div className="mx-auto mt-4 w-40" dangerouslySetInnerHTML={{ __html: t.svg }} />
                <div className="mt-4 font-callig text-lg leading-none">امسح واطلب من طاولتك</div>
                <div className="font-latin mt-1 text-sm italic">Okutun, sipariş verin, aşkla gönderin</div>
                <div className="font-latin text-xs italic opacity-70">Scan to order, share & send with love</div>
                <span className="absolute -top-1 right-1/2 h-2 w-2 translate-x-1/2 rotate-45 bg-[#931d1e]" />
              </div>
            </div>
            <div className="no-print mt-2 grid grid-cols-3 gap-1.5 text-xs">
              <button onClick={() => run(`c${t.id}`, () => downloadCard(t))} className="inline-flex items-center justify-center gap-1 rounded-lg bg-gold/15 px-2 py-2 text-gold"><Download size={12} /> {busy === `c${t.id}` ? "…" : "Card"}</button>
              <button onClick={() => run(`q${t.id}`, () => downloadQr(t))} className="inline-flex items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-2 text-mist"><QrCode size={12} /> QR only</button>
              <button onClick={() => printOnly(t.id)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-white/5 px-2 py-2 text-mist"><Printer size={12} /> Print</button>
            </div>
            <div className="no-print mt-1.5 flex items-center gap-1.5 text-xs">
              <a href={t.url.replace(/^https?:\/\/[^/]+/, "")} target="_blank" className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-mist"><ExternalLink size={12} /> Open</a>
              <button onClick={() => copy(t)} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-mist"><Copy size={12} /> {copied === t.id ? "Copied" : "Link"}</button>
              <button onClick={() => regen(t.id)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-white/5 px-2.5 py-1.5 text-mist"><RefreshCw size={12} /> New code</button>
              <button onClick={() => toggle(t)} className="ms-auto rounded-lg bg-white/5 px-2.5 py-1.5 text-mist">{t.active ? "Disable" : "Enable"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
