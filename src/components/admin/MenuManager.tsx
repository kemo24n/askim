"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Pencil, Percent, Plus, Search, Star, Trash2, X } from "lucide-react";
import type { Category, Item } from "@/db/schema";
import { Img } from "@/components/ui/Img";
import { PageTitle } from "./AdminShell";
import { api, syp } from "./fmt";

const ROLES = ["breakfast", "mezza", "salad", "soup", "bread", "main", "side", "drink", "dessert", "shisha"] as const;
const TAGS = ["spicy", "vegetarian", "sharing", "turkish", "cold", "hot", "kids", "new"];

export function MenuManager({ categories, items: initial }: { categories: Category[]; items: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [cat, setCat] = useState<number | "all">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const tops = categories.filter((c) => !c.parentId);
  const childrenOf = (id: number) => categories.filter((c) => c.parentId === id);
  const leafIds = (id: number) => { const k = childrenOf(id); return k.length ? k.map((x) => x.id) : [id]; };

  const list = useMemo(() => {
    const ql = q.trim().toLocaleLowerCase("tr");
    const ids = cat === "all" ? null : new Set(categories.find((c) => c.id === cat)?.parentId ? [cat] : leafIds(cat as number));
    return items.filter((i) => (!ids || ids.has(i.categoryId)) && (!ql || `${i.nameEn} ${i.nameAr} ${i.nameTr ?? ""}`.toLocaleLowerCase("tr").includes(ql)));
  }, [items, cat, q, categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 2600); };
  const patch = async (id: number, data: Partial<Item>) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...data } : x)));
    try { await api(`/api/admin/items/${id}`, "PATCH", data); } catch (e) { flash((e as Error).message); }
  };

  const save = async () => {
    if (!editing) return;
    const body = {
      categoryId: Number(editing.categoryId), nameAr: editing.nameAr ?? "", nameEn: editing.nameEn ?? "", nameTr: editing.nameTr || null,
      descAr: editing.descAr || null, descEn: editing.descEn || null, descTr: editing.descTr || null, price: Number(editing.price ?? 0),
      image: editing.image || null, available: editing.available ?? true, signature: editing.signature ?? false,
      tags: editing.tags ?? [], role: editing.role ?? "main", serves: Number(editing.serves ?? 1), prepMinutes: Number(editing.prepMinutes ?? 15),
    };
    try {
      if (editing.id) {
        const row = await api(`/api/admin/items/${editing.id}`, "PATCH", body);
        setItems((xs) => xs.map((x) => (x.id === row.id ? row : x)));
      } else {
        const row = await api(`/api/admin/items`, "POST", body);
        setItems((xs) => [...xs, row]);
      }
      setEditing(null); flash("Saved — live on the guest menu");
    } catch (e) { flash((e as Error).message); }
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this item permanently?")) return;
    await api(`/api/admin/items/${id}`, "DELETE");
    setItems((xs) => xs.filter((x) => x.id !== id)); setEditing(null);
  };
  const catName = (id: number) => categories.find((c) => c.id === id)?.nameEn ?? "";

  return (
    <div>
      <PageTitle title="Menu" sub={`${items.length} items · changes go live instantly`}
        right={
          <div className="flex gap-2">
            <button onClick={() => setBulkOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2.5 text-sm text-gold"><Percent size={15} /> Bulk price update</button>
            <button onClick={() => setEditing({ categoryId: typeof cat === "number" ? leafIds(cat)[0] : categories.find((c) => c.parentId)?.id, available: true, tags: [], role: "main", serves: 1, prepMinutes: 15, price: 0 })}
              className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm"><Plus size={15} /> New item</button>
          </div>
        } />

      {msg && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold px-5 py-2.5 text-sm text-ink shadow-xl">{msg}</div>}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="panel h-fit p-3 lg:sticky lg:top-6">
          <button onClick={() => setCat("all")} className={`w-full rounded-lg px-3 py-2 text-start text-sm ${cat === "all" ? "bg-gold/15 text-gold" : "text-mist"}`}>All items</button>
          {tops.map((t) => (
            <div key={t.id} className="mt-2">
              <button onClick={() => setCat(t.id)} className={`w-full rounded-lg px-3 py-2 text-start text-sm font-semibold ${cat === t.id ? "bg-gold/15 text-gold" : "text-champagne"}`}>{t.nameEn}</button>
              {childrenOf(t.id).map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} className={`flex w-full justify-between rounded-lg px-3 py-1.5 ps-6 text-start text-[13px] ${cat === c.id ? "bg-gold/15 text-gold" : "text-mist hover:text-champagne"}`}>
                  <span>{c.nameEn}</span><span className="text-smoke">{items.filter((i) => i.categoryId === c.id).length}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line/60 p-3">
            <Search size={16} className="ms-2 text-smoke" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in Arabic, Turkish or English…" className="!border-0 !bg-transparent flex-1" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-start text-[11px] uppercase tracking-[0.15em] text-smoke">
                <tr className="border-b border-line/60">
                  <th className="p-3 text-start">Item</th><th className="p-3 text-start">Category</th><th className="p-3 text-start">Price (SYP)</th>
                  <th className="p-3 text-center">Signature</th><th className="p-3 text-center">Available</th><th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((i) => (
                  <tr key={i.id} className="border-b border-line/30 hover:bg-white/[0.02]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Img src={i.image} alt="" className="h-11 w-11 shrink-0 rounded-lg" />
                        <div className="min-w-0">
                          <div className="truncate text-champagne">{i.nameEn}</div>
                          <div className="truncate text-xs text-smoke"><span dir="rtl">{i.nameAr}</span>{i.nameTr ? ` · ${i.nameTr}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-mist">{catName(i.categoryId)}</td>
                    <td className="p-3">
                      <PriceInput value={i.price} onCommit={(v) => patch(i.id, { price: v })} />
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => patch(i.id, { signature: !i.signature })} aria-label="signature"><Star size={18} className={i.signature ? "text-gold" : "text-white/15"} fill={i.signature ? "currentColor" : "none"} /></button>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => patch(i.id, { available: !i.available })} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${i.available ? "bg-emerald-500/15 text-emerald-300" : "bg-rose/15 text-rose"}`}>
                        {i.available ? <><Eye size={13} /> On</> : <><EyeOff size={13} /> Sold out</>}
                      </button>
                    </td>
                    <td className="p-3 text-end"><button onClick={() => setEditing(i)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/5" aria-label="Edit"><Pencil size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <p className="p-10 text-center text-smoke">No items.</p>}
          </div>
        </div>
      </div>

      {editing && (
        <Modal title={editing.id ? "Edit item" : "New item"} onClose={() => setEditing(null)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)"><input value={editing.nameEn ?? ""} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} /></Field>
            <Field label="الاسم (عربي)"><input dir="rtl" value={editing.nameAr ?? ""} onChange={(e) => setEditing({ ...editing, nameAr: e.target.value })} /></Field>
            <Field label="Ad (Türkçe)" wide><input value={editing.nameTr ?? ""} onChange={(e) => setEditing({ ...editing, nameTr: e.target.value })} /></Field>
            <Field label="Description (English)" wide><textarea rows={2} value={editing.descEn ?? ""} onChange={(e) => setEditing({ ...editing, descEn: e.target.value })} /></Field>
            <Field label="الوصف (عربي)" wide><textarea dir="rtl" rows={2} value={editing.descAr ?? ""} onChange={(e) => setEditing({ ...editing, descAr: e.target.value })} /></Field>
            <Field label="Açıklama (Türkçe)" wide><textarea rows={2} value={editing.descTr ?? ""} onChange={(e) => setEditing({ ...editing, descTr: e.target.value })} /></Field>
            <Field label="Price (new SYP)"><input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></Field>
            <Field label="Category">
              <select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })}>
                {categories.filter((c) => c.parentId || !childrenOf(c.id).length).map((c) => <option key={c.id} value={c.id}>{c.nameEn}</option>)}
              </select>
            </Field>
            <Field label="Photo" wide>
              <div className="flex items-center gap-3">
                <Img src={editing.image} alt="" className="h-16 w-16 shrink-0 rounded-xl" />
                <label className="cursor-pointer rounded-xl border border-gold/30 px-4 py-2 text-sm text-gold">
                  Upload photo
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const fd = new FormData(); fd.append("file", f);
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    const j = await res.json().catch(() => ({}));
                    if (res.ok) setEditing((x) => (x ? { ...x, image: j.path } : x)); else flash(j.error || "Upload failed");
                  }} />
                </label>
                <input className="flex-1" value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="or paste an image URL" />
              </div>
            </Field>
            <Field label="Oracle role">
              <select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Serves"><input type="number" min={1} value={editing.serves ?? 1} onChange={(e) => setEditing({ ...editing, serves: Number(e.target.value) })} /></Field>
              <Field label="Prep (min)"><input type="number" min={0} value={editing.prepMinutes ?? 15} onChange={(e) => setEditing({ ...editing, prepMinutes: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Tags" wide>
              <div className="flex flex-wrap gap-2">
                {TAGS.map((t) => {
                  const on = editing.tags?.includes(t);
                  return <button type="button" key={t} onClick={() => setEditing({ ...editing, tags: on ? editing.tags!.filter((x) => x !== t) : [...(editing.tags ?? []), t] })}
                    className={`rounded-full px-3 py-1 text-xs ${on ? "bg-gold text-ink" : "border border-line text-mist"}`}>{t}</button>;
                })}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.signature ?? false} onChange={(e) => setEditing({ ...editing, signature: e.target.checked })} /> Aşkım signature</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.available ?? true} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} /> Available</label>
          </div>
          <div className="mt-6 flex items-center gap-2">
            {editing.id && <button onClick={() => remove(editing.id!)} className="inline-flex items-center gap-2 rounded-xl border border-rose/40 px-4 py-2.5 text-sm text-rose"><Trash2 size={14} /> Delete</button>}
            <div className="flex-1" />
            <button onClick={() => setEditing(null)} className="rounded-xl border border-line px-4 py-2.5 text-sm">Cancel</button>
            <button onClick={save} className="btn-gold rounded-xl px-6 py-2.5 text-sm">Save</button>
          </div>
        </Modal>
      )}

      {bulkOpen && <BulkPrice categories={categories} onClose={() => setBulkOpen(false)} onDone={(m) => { flash(m); router.refresh(); setTimeout(() => location.reload(), 600); }} />}
    </div>
  );
}

function PriceInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  const [focus, setFocus] = useState(false);
  const shown = focus ? v : String(value);
  const commit = () => { setFocus(false); const n = Math.round(Number(v)); if (Number.isFinite(n) && n >= 0 && n !== value) onCommit(n); };
  return (
    <input value={shown} inputMode="numeric" onFocus={() => { setV(String(value)); setFocus(true); }} onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ""))}
      onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className="w-28 tabular-nums !py-1.5 text-gold" />
  );
}

function BulkPrice({ categories, onClose, onDone }: { categories: Category[]; onClose: () => void; onDone: (m: string) => void }) {
  const [percent, setPercent] = useState(10);
  const [roundTo, setRoundTo] = useState(10);
  const [scope, setScope] = useState<number[]>([]);
  const [preview, setPreview] = useState<{ count: number; changed: number; sample: { nameEn: string; from: number; to: number }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const tops = categories.filter((c) => !c.parentId);
  const run = async (dryRun: boolean) => {
    setBusy(true);
    const res = await api("/api/admin/items/bulk-price", "POST", { percent, roundTo, categoryIds: scope.length ? scope : undefined, dryRun });
    setBusy(false);
    if (dryRun) setPreview(res); else { onClose(); onDone(`${res.changed} prices updated`); }
  };
  return (
    <Modal title="Bulk price update" onClose={onClose}>
      <p className="text-sm text-mist">Move prices up or down in one step, rounded to a clean number. Handy when the exchange rate moves.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Change (%)"><input type="number" value={percent} onChange={(e) => { setPercent(Number(e.target.value)); setPreview(null); }} /></Field>
        <Field label="Round to (SYP)">
          <select value={roundTo} onChange={(e) => { setRoundTo(Number(e.target.value)); setPreview(null); }}>{[1, 5, 10, 50, 100].map((r) => <option key={r} value={r}>{r}</option>)}</select>
        </Field>
        <Field label="Apply to" wide>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setScope([]); setPreview(null); }} className={`rounded-full px-3 py-1 text-xs ${!scope.length ? "bg-gold text-ink" : "border border-line"}`}>Whole menu</button>
            {tops.map((t) => {
              const on = scope.includes(t.id);
              return <button key={t.id} onClick={() => { setScope(on ? scope.filter((x) => x !== t.id) : [...scope, t.id]); setPreview(null); }} className={`rounded-full px-3 py-1 text-xs ${on ? "bg-gold text-ink" : "border border-line"}`}>{t.nameEn}</button>;
            })}
          </div>
        </Field>
      </div>
      {preview && (
        <div className="mt-5 rounded-xl bg-white/[0.03] p-4 text-sm">
          <div className="mb-2 text-mist">{preview.changed} of {preview.count} items will change. Preview:</div>
          <ul className="space-y-1">{preview.sample.map((s) => <li key={s.nameEn} className="flex justify-between"><span>{s.nameEn}</span><span className="tabular-nums text-mist">{syp(s.from)} → <b className="text-gold">{syp(s.to)}</b></span></li>)}</ul>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={() => run(true)} disabled={busy} className="rounded-xl border border-line px-4 py-2.5 text-sm">Preview</button>
        <button onClick={() => run(false)} disabled={busy || !preview} className="btn-gold rounded-xl px-6 py-2.5 text-sm disabled:opacity-40">Apply</button>
      </div>
    </Modal>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog">
      <button className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close" />
      <div className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-noir p-6 animate-rise">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl">{title}</h2><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-white/5"><X size={16} /></button></div>
        {children}
      </div>
    </div>
  );
}
export function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`flex flex-col gap-1.5 text-xs text-smoke [&_input]:w-full [&_select]:w-full [&_textarea]:w-full ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}
