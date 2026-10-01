"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Logo } from "@/components/guest/Logo";

export function LoginForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (res.ok) { router.replace("/admin"); router.refresh(); }
    else { setErr("Wrong password"); setBusy(false); }
  };
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_20%,rgba(147,29,30,0.35),transparent_70%)]" />
      <form onSubmit={submit} className="relative w-full max-w-sm text-center">
        <Logo size="lg" />
        <div className="mt-3 text-[11px] uppercase tracking-[0.5em] text-smoke">Control Room</div>
        <div className="mt-10 flex items-center gap-2 rounded-2xl border border-gold/20 bg-black/40 px-4">
          <Lock size={16} className="text-smoke" />
          <input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password"
            className="!border-0 !bg-transparent h-14 flex-1 !px-0 text-base" />
        </div>
        {err && <p className="mt-3 text-sm text-rose">{err}</p>}
        <button disabled={!pw || busy} className="btn-gold mt-5 w-full rounded-2xl py-4 disabled:opacity-50">Enter</button>
      </form>
    </main>
  );
}
