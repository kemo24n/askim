"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/guest/Logo";

function Gate() {
  const params = useSearchParams();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(false);
    const res = await fetch("/api/access", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) {
      const next = params.get("next");
      window.location.href = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
    } else { setErr(true); setBusy(false); }
  };
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_25%,rgba(147,29,30,0.35),transparent_70%)]" />
      <form onSubmit={submit} className="relative w-full max-w-sm text-center">
        <Logo size="lg" />
        <div className="mt-4 text-[11px] uppercase tracking-[0.45em] text-gold/80" dir="ltr">Private preview</div>
        <p className="mt-4 text-sm leading-relaxed text-mist">عرض خاص وسرّي · Özel önizleme · Confidential demo</p>
        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-gold/25 bg-black/40 px-4" dir="ltr">
          <Lock size={16} className="text-smoke" />
          <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password · كلمة السر · Şifre"
            className="h-14 flex-1 bg-transparent text-base text-champagne outline-none placeholder:text-smoke" />
        </div>
        {err && <p className="mt-3 text-sm text-rose">كلمة السر غير صحيحة · Wrong password</p>}
        <button disabled={!pw || busy} className="btn-gold mt-5 w-full rounded-2xl py-4 disabled:opacity-50">دخول · Enter</button>
        <p className="mt-10 text-[11px] text-smoke" dir="ltr">© Solunera · Confidential demo for Aşkım</p>
      </form>
    </main>
  );
}

export default function AccessPage() {
  return <Suspense><Gate /></Suspense>;
}
