"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, ArrowRight } from "lucide-react";
import { LANG_LABEL, LANGS, t, type Lang } from "@/lib/i18n";
import { mediaUrl, withFallback } from "@/lib/media";
import { Logo } from "./Logo";

const SUGGEST: Record<Lang, string[]> = { ar: ["ليلى", "سامر", "نور", "كريم"], tr: ["Elif", "Can", "Zeynep", "Emre"], en: ["Layla", "Sam", "Nour", "Karim"] };

export function JoinTable({ lang, token, tableNumber, zone, coverUrl }: { lang: Lang; token: string; tableNumber: number; zone: string; coverUrl: string | null }) {
  const d = t(lang);
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const cover = mediaUrl(coverUrl);

  async function join(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    const res = await fetch("/api/table/join", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, name }) });
    if (res.ok) { router.replace(`/${lang}`); router.refresh(); }
    else { setErr((await res.json().catch(() => ({}))).error ?? "Error"); setBusy(false); }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" onError={withFallback(coverUrl, (el) => (el.style.display = "none"))} className="absolute inset-0 h-full w-full object-cover opacity-35 scale-110 blur-[2px]" />
      )}
      <div className="absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(147,29,30,0.35),transparent_70%),linear-gradient(to_bottom,rgba(11,9,8,0.4),#0b0908_75%)]" />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <Logo size="lg" className="animate-rise" />
        <div className="hairline my-8 w-40 animate-fade" />
        <div className="animate-rise [animation-delay:120ms] inline-flex items-center gap-2 rounded-full border border-gold/25 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-gold">
          <Users size={14} /> {d.table} {tableNumber} · {zone}
        </div>
        <h1 className="mt-6 font-display text-4xl text-champagne animate-rise [animation-delay:200ms]">{d.joinTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-mist animate-rise [animation-delay:280ms]">{d.joinSub}</p>
        <form onSubmit={join} className="mt-8 w-full animate-rise [animation-delay:360ms]">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder={d.yourName}
            className="w-full rounded-2xl border border-gold/25 bg-black/40 px-5 py-4 text-center text-lg text-champagne placeholder:text-smoke outline-none focus:border-gold"
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SUGGEST[lang].map((n) => (
              <button type="button" key={n} onClick={() => setName(n)} className="rounded-full bg-white/5 px-3 py-1 text-xs text-mist hover:bg-white/10">{n}</button>
            ))}
          </div>
          <button disabled={!name.trim() || busy} className="btn-gold mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base disabled:opacity-50">
            {d.join} <Arrow size={18} />
          </button>
          {err && <p className="mt-3 text-sm text-rose">{err}</p>}
        </form>
        <div className="mt-8 flex gap-2">
          {LANGS.map((l) => (
            <a key={l} href={`/${l}/t/${token}`} onClick={() => { document.cookie = `askim_lang=${l}; path=/; max-age=31536000`; }}
              className={`rounded-full px-3 py-1.5 text-xs ${l === lang ? "bg-gold/15 text-gold" : "text-smoke hover:text-champagne"}`}>{LANG_LABEL[l]}</a>
          ))}
        </div>
      </div>
    </main>
  );
}
