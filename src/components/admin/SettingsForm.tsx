"use client";
import { useState } from "react";
import { Save } from "lucide-react";
import type { Settings } from "@/db/schema";
import { PageTitle } from "./AdminShell";
import { Field } from "./MenuManager";
import { api } from "./fmt";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState(initial);
  const [saved, setSaved] = useState<string | null>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));
  const save = async () => {
    try {
      const { id: _id, updatedAt: _u, ...body } = s;
      await api("/api/admin/settings", "PATCH", body);
      setSaved("Saved — live now");
    } catch (e) { setSaved((e as Error).message); }
    setTimeout(() => setSaved(null), 2500);
  };
  const num = (k: "rateUSD" | "rateEUR" | "rateTRY" | "rateAED" | "serviceFeePct") => (
    <input type="number" step="0.01" value={s[k]} onChange={(e) => set(k, Number(e.target.value))} />
  );
  const txt = (k: keyof Settings, dir?: "rtl") => (
    <input dir={dir} value={(s[k] as string | null) ?? ""} onChange={(e) => set(k, (e.target.value || null) as never)} />
  );
  const toggle = (k: "showOldSYP" | "giftsEnabled" | "ordersEnabled", label: string, hint: string) => (
    <label className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-4">
      <input type="checkbox" className="mt-1 h-4 w-4 accent-[#c9a86a]" checked={s[k]} onChange={(e) => set(k, e.target.checked)} />
      <span><span className="block text-sm text-champagne">{label}</span><span className="text-xs text-smoke">{hint}</span></span>
    </label>
  );

  return (
    <div>
      <PageTitle title="Settings" right={<button onClick={save} className="btn-gold inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"><Save size={15} /> Save</button>} />
      {saved && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold px-5 py-2.5 text-sm text-ink shadow-xl">{saved}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-display text-2xl">Exchange rates</h2>
          <p className="mt-1 text-xs text-smoke">How many <b>new</b> Syrian pounds equal one unit. Guests see prices in the currency they choose.</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="1 USD =">{num("rateUSD")}</Field>
            <Field label="1 EUR =">{num("rateEUR")}</Field>
            <Field label="1 TRY =">{num("rateTRY")}</Field>
            <Field label="1 AED =">{num("rateAED")}</Field>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-display text-2xl">Service</h2>
          <div className="mt-4 grid gap-3">
            {toggle("ordersEnabled", "Guests can order from the table", "Turn off to use the menu as view-only.")}
            {toggle("giftsEnabled", "“Send with love” gifts", "Guests can send a dessert or drink to another table. You approve each one.")}
            {toggle("showOldSYP", "Show old-lira price too", "Adds the old SYP amount under each price.")}
            <Field label="Service charge (%)">{num("serviceFeePct")}</Field>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-display text-2xl">Brand</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)">{txt("nameEn")}</Field>
            <Field label="الاسم (عربي)">{txt("nameAr", "rtl")}</Field>
            <Field label="Tagline (English)">{txt("taglineEn")}</Field>
            <Field label="الشعار (عربي)">{txt("taglineAr", "rtl")}</Field>
            <Field label="Hero / cover image" wide>{txt("coverUrl")}</Field>
            <Field label="Logo image" wide>{txt("logoUrl")}</Field>
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-display text-2xl">Contact & social</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Phone">{txt("phone")}</Field>
            <Field label="WhatsApp">{txt("whatsapp")}</Field>
            <Field label="Instagram URL">{txt("instagram")}</Field>
            <Field label="Facebook URL">{txt("facebook")}</Field>
            <Field label="Google reviews URL" wide>{txt("googleReviews")}</Field>
            <Field label="Address" wide>{txt("address")}</Field>
          </div>
        </section>
      </div>
    </div>
  );
}
