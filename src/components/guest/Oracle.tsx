"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Minus, Plus, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { loc } from "@/lib/i18n";
import { composeTable, oracleTotal, type Mood, type OraclePick, type Pref } from "@/lib/oracle";
import { Img } from "@/components/ui/Img";
import { Sheet } from "@/components/ui/Sheet";
import { useMenu } from "./context";

const MOODS: { id: Mood; emoji: string }[] = [
  { id: "feast", emoji: "🫓" }, { id: "grill", emoji: "🔥" }, { id: "light", emoji: "🌿" },
  { id: "sweet", emoji: "☕" }, { id: "brunch", emoji: "🍳" }, { id: "surprise", emoji: "✨" },
];
const PREFS: Pref[] = ["vegetarian", "noSpicy", "shisha", "kids"];
const PER_PERSON = [1500, 2500, 4000, 6000];

export function Oracle({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, lang, data, price, table, addMany, openItem } = useMenu();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<Mood>("feast");
  const [people, setPeople] = useState(2);
  const [pp, setPp] = useState<number | null>(2500);
  const [prefs, setPrefs] = useState<Pref[]>([]);
  const [seed, setSeed] = useState(1);
  const [adding, setAdding] = useState(false);
  const Next = lang === "ar" ? ArrowLeft : ArrowRight;
  const Prev = lang === "ar" ? ArrowRight : ArrowLeft;

  const picks: OraclePick[] = useMemo(
    () => (step === 4 ? composeTable(data.items, { mood, people, budget: pp ? pp * people : null, prefs, seed }) : []),
    [step, data.items, mood, people, pp, prefs, seed],
  );
  const total = oracleTotal(picks);

  const reset = () => { setStep(0); onClose(); };
  const togglePref = (p: Pref) => setPrefs((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));

  const addAll = async () => {
    setAdding(true);
    const okd = await addMany(picks.map((p) => ({ itemId: p.item.id, qty: p.qty })));
    setAdding(false);
    if (okd) reset();
  };

  const title = (
    <div className="flex items-center gap-2 text-gold">
      <Wand2 size={18} />
      <span className="font-display text-xl">{d.oracle}</span>
      {step < 4 && <span className="ms-2 text-xs text-smoke tabular-nums">{step + 1}/4</span>}
    </div>
  );

  return (
    <Sheet open={open} onClose={reset} title={title} labelClose={d.close} tall>
      <div className="px-6 pb-8">
        {step < 4 && (
          <div className="mb-6 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-gold" : "bg-white/10"}`} />)}
          </div>
        )}

        {step === 0 && (
          <div className="animate-rise">
            <h3 className="font-display text-3xl text-champagne">{d.oracleQ1}</h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {MOODS.map((m) => (
                <button key={m.id} onClick={() => { setMood(m.id); setStep(1); }}
                  className={`card-lux rounded-3xl p-5 text-start transition hover:ring-gold ${mood === m.id ? "ring-gold" : ""}`}>
                  <div className="text-3xl">{m.emoji}</div>
                  <div className="mt-3 font-display text-lg leading-tight text-champagne">{d.moods[m.id]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-rise text-center">
            <h3 className="font-display text-3xl text-champagne">{d.oracleQ2}</h3>
            <div className="mt-10 flex items-center justify-center gap-8">
              <button onClick={() => setPeople((p) => Math.max(1, p - 1))} className="grid h-14 w-14 place-items-center rounded-full border border-gold/30 text-gold"><Minus /></button>
              <div className="font-display text-8xl leading-none text-gold-2 tabular-nums">{people}</div>
              <button onClick={() => setPeople((p) => Math.min(20, p + 1))} className="grid h-14 w-14 place-items-center rounded-full border border-gold/30 text-gold"><Plus /></button>
            </div>
            <div className="mt-6 flex justify-center gap-1">
              {Array.from({ length: Math.min(people, 12) }).map((_, i) => <span key={i} className="h-2 w-2 rounded-full bg-gold/70 animate-fade" />)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-rise">
            <h3 className="font-display text-3xl text-champagne">{d.oracleQ3}</h3>
            <div className="mt-6 grid gap-3">
              {PER_PERSON.map((v) => (
                <button key={v} onClick={() => setPp(v)} className={`flex items-center justify-between rounded-2xl border px-5 py-4 transition ${pp === v ? "border-gold bg-gold/10" : "border-gold/15"}`}>
                  <span className="text-lg tabular-nums text-champagne">{price(v * people)}</span>
                  <span className="text-xs text-mist tabular-nums">{price(v)} {d.perPerson}</span>
                </button>
              ))}
              <button onClick={() => setPp(null)} className={`rounded-2xl border px-5 py-4 text-start text-lg transition ${pp === null ? "border-gold bg-gold/10" : "border-gold/15"}`}>{d.noLimit}</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-rise">
            <h3 className="font-display text-3xl text-champagne">{d.oracleQ4}</h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {PREFS.map((p) => (
                <button key={p} onClick={() => togglePref(p)} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm transition ${prefs.includes(p) ? "bg-gold text-ink" : "border border-gold/25"}`}>
                  {prefs.includes(p) && <Check size={14} />} {d.prefs[p]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-rise">
            <div className="text-center">
              <Sparkles className="mx-auto text-gold animate-float" />
              <h3 className="mt-3 font-display text-4xl text-champagne">{d.oracleResult}</h3>
              <p className="mt-1 text-sm text-mist">{d.oracleResultSub}</p>
              <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-gold/25 px-5 py-2">
                <span className="text-lg text-gold tabular-nums">{price(total)}</span>
                <span className="text-xs text-mist tabular-nums">≈ {price(Math.round(total / people))} {d.perPerson}</span>
              </div>
            </div>
            <ul className="mt-6 space-y-2">
              {picks.map((p, i) => (
                <li key={p.item.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <button onClick={() => openItem(p.item.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.03] p-2 text-start">
                    <Img src={p.item.image} alt="" label={loc(p.item, "name", lang).slice(0, 1)} className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-champagne">{loc(p.item, "name", lang)}</div>
                      <div className="text-xs text-smoke">{d.courses[p.reason]}</div>
                    </div>
                    <div className="text-end text-sm">
                      <div className="text-gold tabular-nums">{price(p.item.price * p.qty)}</div>
                      {p.qty > 1 && <div className="text-xs text-smoke">×{p.qty}</div>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 grid gap-3">
              {table ? (
                <button onClick={addAll} disabled={adding || !picks.length} className="btn-gold rounded-full py-4 disabled:opacity-60">{d.addAll}</button>
              ) : (
                <div className="rounded-2xl bg-white/5 p-4 text-center text-sm text-mist">{d.scanToOrder}</div>
              )}
              <button onClick={() => setSeed((x) => x + 1)} className="btn-ghost inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-sm">
                <RefreshCw size={15} /> {d.reroll}
              </button>
            </div>
          </div>
        )}

        {step > 0 && step < 4 && (
          <div className="mt-10 flex gap-3">
            <button onClick={() => setStep((s) => s - 1)} className="btn-ghost grid h-14 w-14 place-items-center rounded-full"><Prev size={18} /></button>
            <button onClick={() => setStep((s) => s + 1)} className="btn-gold flex-1 inline-flex items-center justify-center gap-2 rounded-full">
              {step === 3 ? <><Wand2 size={17} /> {d.buildTable}</> : <>{d.next} <Next size={17} /></>}
            </button>
          </div>
        )}
        {step === 4 && (
          <button onClick={() => setStep(0)} className="mt-4 w-full text-center text-xs text-smoke">{d.back}</button>
        )}
      </div>
    </Sheet>
  );
}
