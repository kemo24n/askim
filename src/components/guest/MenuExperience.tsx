"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BellRing, ChevronDown, Clapperboard, Coins, Gift, Globe, MessageCircleHeart, QrCode, Search,
  ShoppingBag, Sparkles, Wand2, X,
} from "lucide-react";
import { Facebook, Instagram } from "@/components/ui/BrandIcons";
import { loc, type Lang } from "@/lib/i18n";
import { currentDaypart, type Daypart } from "@/lib/daypart";
import { mediaUrl } from "@/lib/media";
import type { MenuCategory, MenuData, MenuItem, TableContext } from "@/lib/types";
import type { TableState } from "@/lib/table-state";
import { MenuProvider, useMenu } from "./context";
import { ItemPoster, ItemRow } from "./ItemCard";
import { ItemSheet } from "./ItemSheet";
import { Oracle } from "./Oracle";
import { Stories } from "./Stories";
import { Logo } from "./Logo";
import { Avatar, CartSheet, CurrencySheet, FeedbackSheet, GiftArrival, GiftSheet, LanguageSheet, ServiceSheet } from "./TableSheets";

export function MenuExperience(props: { lang: Lang; data: MenuData; table: TableContext; initialState: TableState | null }) {
  return (
    <MenuProvider {...props}>
      <Experience />
    </MenuProvider>
  );
}

const GROUP_ORDER: Record<Daypart, number[]> = {
  morning: [34125, 34140, 34151, 34152],
  afternoon: [34125, 34140, 34151, 34152],
  evening: [34125, 34152, 34151, 34140],
  night: [34152, 34151, 34140, 34125],
};
const FILTERS = ["vegetarian", "spicy", "sharing", "turkish", "cold", "hot", "kids"] as const;

function Experience() {
  const { lang, d, data, table, state, price, openItem } = useMenu();
  const [daypart, setDaypart] = useState<Daypart>("evening");
  useEffect(() => setDaypart(currentDaypart()), []);

  const [sheet, setSheet] = useState<null | "oracle" | "stories" | "cart" | "service" | "gift" | "currency" | "feedback" | "language">(null);
  const [giftPreset, setGiftPreset] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sections = leaf categories, grouped & ordered by time of day
  const sections = useMemo(() => {
    const cats = data.categories;
    const tops = cats.filter((c) => !c.parentId);
    const order = GROUP_ORDER[daypart];
    tops.sort((a, b) => (order.indexOf(a.id) + 99) % 99 - (order.indexOf(b.id) + 99) % 99);
    const out: { cat: MenuCategory; group: MenuCategory; items: MenuItem[] }[] = [];
    for (const top of tops) {
      const kids = cats.filter((c) => c.parentId === top.id).sort((a, b) => a.sort - b.sort);
      const leaves = kids.length ? kids : [top];
      // morning: breakfast first; evening: grills earlier
      if (top.id === 34125) {
        leaves.sort((a, b) => {
          const w = (c: MenuCategory) => (c.dayparts.includes(daypart) ? 0 : 1);
          return w(a) - w(b) || a.sort - b.sort;
        });
      }
      for (const leaf of leaves) {
        const items = data.items.filter((i) => i.categoryId === leaf.id);
        if (items.length) out.push({ cat: leaf, group: top, items });
      }
    }
    return out;
  }, [data, daypart]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q && !filter) return sections;
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          const hay = `${i.nameAr} ${i.nameEn} ${i.nameTr ?? ""} ${i.descAr ?? ""} ${i.descEn ?? ""} ${i.descTr ?? ""}`.toLocaleLowerCase("tr");
          return (!q || hay.includes(q)) && (!filter || i.tags.includes(filter));
        }),
      }))
      .filter((s) => s.items.length);
  }, [sections, query, filter]);

  const signature = useMemo(() => data.items.filter((i) => i.signature && i.available && i.image), [data.items]);
  const moment = useMemo(() => {
    const cats = new Set(data.categories.filter((c) => c.dayparts.includes(daypart)).map((c) => c.id));
    return data.items
      .filter((i) => cats.has(i.categoryId) && i.available && i.image)
      .sort((a, b) => b.today - a.today || Number(b.signature) - Number(a.signature))
      .slice(0, 12);
  }, [data, daypart]);
  const storyItems = useMemo(() => [...signature, ...moment.filter((m) => !m.signature)], [signature, moment]);

  // scroll-spy
  useEffect(() => {
    const els = filteredSections.map((s) => document.getElementById(`cat-${s.cat.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(Number(vis.target.id.replace("cat-", "")));
      },
      { rootMargin: "-120px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [filteredSections]);
  useEffect(() => {
    if (!active || !navRef.current) return;
    const chip = navRef.current.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    chip?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  const jump = (id: number) => {
    const el = document.getElementById(`cat-${id}`);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 118, behavior: "smooth" });
  };

  const switchLang = (next: Lang) => {
    document.cookie = `askim_lang=${next}; path=/; max-age=31536000`;
    window.location.href = `/${next}${window.location.hash}`;
  };

  const cartCount = state?.cart.reduce((a, c) => a + c.qty, 0) ?? 0;
  const cartTotal = state?.cart.reduce((a, c) => {
    const it = data.items.find((i) => i.id === c.itemId);
    return a + (it?.price ?? 0) * c.qty;
  }, 0) ?? 0;
  const liveOrders = state?.orders.filter((o) => ["new", "preparing", "ready"].includes(o.status)).length ?? 0;
  const s = data.settings;
  const cover = mediaUrl(s.coverUrl);
  const greeting = d[daypart];

  return (
    <div className="relative">
      {/* ─── Top bar ─── */}
      <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${scrolled ? "glass border-x-0 border-t-0" : "bg-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4 pt-[env(safe-area-inset-top)]">
          <div className={`transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"}`}><Logo size="sm" /></div>
          <div className="flex-1" />
          {table && (
            <button onClick={() => setSheet("cart")} className="inline-flex items-center gap-2 rounded-full bg-black/40 py-1.5 pe-3 ps-1.5 text-xs backdrop-blur">
              <span className="flex -space-x-1.5 rtl:space-x-reverse">
                {(state?.guests ?? []).slice(0, 3).map((g) => <Avatar key={g.id} name={g.name} color={g.color} size={22} />)}
              </span>
              <span className="text-champagne">{d.table} {table.tableNumber}</span>
            </button>
          )}
          <IconBtn label={d.search} onClick={() => { setSearchOpen(true); setTimeout(() => jump(sections[0]?.cat.id ?? 0), 10); }}><Search size={18} /></IconBtn>
          <IconBtn label={d.currency} onClick={() => setSheet("currency")}><Coins size={18} /></IconBtn>
          <IconBtn label={d.language} onClick={() => setSheet("language")}><Globe size={18} /></IconBtn>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 animate-[heroZoom_22s_ease-out_both]" />
        )}
        <style>{`@keyframes heroZoom{from{transform:scale(1.15)}to{transform:scale(1)}}`}</style>
        <div className="absolute inset-0 bg-[radial-gradient(80%_55%_at_50%_30%,rgba(147,29,30,0.38),transparent_70%),linear-gradient(to_bottom,rgba(11,9,8,0.35)_0%,rgba(11,9,8,0.55)_45%,#0b0908_92%)]" />
        <Petals />
        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pt-20 text-center">
          <div className="animate-rise text-[11px] uppercase tracking-[0.45em] text-gold/90">{greeting} · {d.welcome}</div>
          <Logo size="xl" className="mt-6 animate-rise [animation-delay:120ms]" />
          <div className="hairline mt-8 w-48 animate-fade [animation-delay:300ms]" />
          <h1 className="mt-8 animate-rise font-display text-[2.6rem] leading-[1.05] text-champagne sm:text-6xl [animation-delay:260ms]">{d.heroTitle}</h1>
          <p className="mt-4 max-w-md animate-rise text-[15px] leading-relaxed text-mist [animation-delay:360ms]">{d.heroSub}</p>

          <div className="mt-10 grid w-full max-w-md grid-cols-2 gap-3 animate-rise [animation-delay:460ms]">
            <button onClick={() => setSheet("oracle")} className="group card-lux relative overflow-hidden rounded-3xl p-4 text-start">
              <Wand2 className="text-gold" size={22} />
              <div className="mt-3 font-display text-xl leading-tight text-champagne">{d.oracle}</div>
              <div className="mt-1 text-xs leading-snug text-mist">{d.oracleSub}</div>
              <span className="absolute -end-6 -top-6 h-20 w-20 rounded-full bg-gold/10 blur-2xl transition group-hover:bg-gold/25" />
            </button>
            <button onClick={() => setSheet("stories")} className="group card-lux relative overflow-hidden rounded-3xl p-4 text-start">
              <Clapperboard className="text-rose" size={22} />
              <div className="mt-3 font-display text-xl leading-tight text-champagne">{d.stories}</div>
              <div className="mt-1 text-xs leading-snug text-mist">{d.storiesSub}</div>
              <span className="absolute -end-6 -top-6 h-20 w-20 rounded-full bg-rose/10 blur-2xl transition group-hover:bg-rose/25" />
            </button>
          </div>
          {!table && (
            <div className="mt-5 inline-flex items-center gap-2 text-xs text-smoke animate-fade [animation-delay:700ms]">
              <QrCode size={14} /> {d.scanToOrder}
            </div>
          )}
        </div>
        <button onClick={() => jump(sections[0]?.cat.id ?? 0)} className="relative mx-auto mb-28 flex flex-col items-center gap-1 text-xs text-mist animate-float">
          {d.explore} <ChevronDown size={18} />
        </button>
      </section>

      {/* ─── Right for this moment ─── */}
      {moment.length > 0 && (
        <Rail title={d.nowServing} kicker={greeting}>
          {moment.map((i) => <ItemPoster key={i.id} item={i} size="md" />)}
        </Rail>
      )}

      {/* ─── Signature ─── */}
      {signature.length > 0 && (
        <Rail title={d.signature} kicker={d.signatureSub} gold>
          {signature.map((i) => <ItemPoster key={i.id} item={i} />)}
        </Rail>
      )}

      {/* ─── Sticky nav ─── */}
      <div className="sticky top-16 z-30 mt-6 glass border-x-0">
        <div className="mx-auto max-w-3xl">
          {searchOpen && (
            <div className="flex items-center gap-2 px-4 pt-3">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-gold/20 bg-black/30 px-4">
                <Search size={16} className="text-smoke" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={d.search}
                  className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-smoke" />
              </div>
              <button onClick={() => { setSearchOpen(false); setQuery(""); }} className="grid h-11 w-11 place-items-center rounded-full bg-white/5"><X size={16} /></button>
            </div>
          )}
          <div ref={navRef} className="flex gap-1 overflow-x-auto px-3 py-2.5 no-scrollbar">
            {filteredSections.map((sec) => (
              <button key={sec.cat.id} data-cat={sec.cat.id} onClick={() => jump(sec.cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] transition ${active === sec.cat.id ? "bg-gold text-ink" : "text-mist hover:text-champagne"}`}>
                {loc(sec.cat, "name", lang)}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter((x) => (x === f ? null : f))}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] transition ${filter === f ? "border-rose bg-rose/15 text-rose" : "border-white/10 text-smoke"}`}>
                {d.filters[f]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Sections ─── */}
      <main className="mx-auto max-w-3xl px-2 pb-40">
        {filteredSections.length === 0 && <p className="py-24 text-center text-mist">{d.noResults}</p>}
        {filteredSections.map((sec, idx) => {
          const newGroup = idx === 0 || filteredSections[idx - 1].group.id !== sec.group.id;
          return (
            <section key={sec.cat.id} id={`cat-${sec.cat.id}`} className="scroll-mt-32">
              {newGroup && sec.group.id !== sec.cat.id && (
                <div className="px-4 pt-16 text-center">
                  <div className="text-[10px] uppercase tracking-[0.5em] text-gold/70">{loc(sec.group, "name", lang)}</div>
                </div>
              )}
              <div className="relative mx-2 mt-10 overflow-hidden rounded-[28px]">
                <SectionBanner cat={sec.cat} count={sec.items.length} />
              </div>
              <div className="mt-2 grid gap-1 sm:grid-cols-2">
                {sec.items.map((i) => <ItemRow key={i.id} item={i} />)}
              </div>
            </section>
          );
        })}

        {/* ─── Footer ─── */}
        <footer className="mt-24 px-6 text-center">
          <Logo size="md" />
          <p className="mt-4 text-sm text-mist">{loc(s, "tagline", lang)}</p>
          <div className="mt-6 flex justify-center gap-3">
            {s.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-full border border-gold/20 text-gold" aria-label="Instagram"><Instagram size={18} /></a>}
            {s.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" className="grid h-11 w-11 place-items-center rounded-full border border-gold/20 text-gold" aria-label="Facebook"><Facebook size={18} /></a>}
            <button onClick={() => setSheet("feedback")} className="inline-flex items-center gap-2 rounded-full border border-gold/20 px-4 text-sm text-gold"><MessageCircleHeart size={16} /> {d.feedback}</button>
          </div>
          <div className="hairline mx-auto my-10 w-40" />
          <p className="text-[11px] tracking-wide text-smoke">
            {d.poweredBy} <a href="https://www.instagram.com/soluneragency" target="_blank" rel="noreferrer" className="text-gold/80">Solunera</a>
          </p>
        </footer>
      </main>

      {/* ─── Dock ─── */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md">
          {table ? (
            <div className="glass flex items-center gap-2 rounded-full p-1.5 shadow-2xl">
              <DockBtn label={d.req.waiter} onClick={() => setSheet("service")} badge={state?.requests.length}><BellRing size={19} /></DockBtn>
              {s.giftsEnabled && <DockBtn label={d.gift} onClick={() => { setGiftPreset(null); setSheet("gift"); }} tone="rose"><Gift size={19} /></DockBtn>}
              <DockBtn label={d.oracle} onClick={() => setSheet("oracle")}><Sparkles size={19} /></DockBtn>
              <button onClick={() => setSheet("cart")} className="btn-gold relative flex h-12 flex-1 items-center justify-between gap-2 rounded-full ps-4 pe-5">
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag size={18} />
                  <span className="text-sm">{cartCount ? `${cartCount}` : liveOrders ? d.orders : d.tableCart}</span>
                </span>
                <span className="text-sm tabular-nums">{cartCount ? price(cartTotal) : liveOrders ? `${liveOrders} ●` : ""}</span>
              </button>
            </div>
          ) : (
            <button onClick={() => setSheet("oracle")} className="btn-gold mx-auto flex h-14 items-center gap-2 rounded-full px-7 shadow-2xl">
              <Wand2 size={18} /> {d.oracle}
            </button>
          )}
        </div>
      </div>

      <ItemSheet onGift={(id) => { setGiftPreset(id); setSheet("gift"); }} />
      <Oracle open={sheet === "oracle"} onClose={() => setSheet(null)} />
      <Stories open={sheet === "stories"} onClose={() => setSheet(null)} items={storyItems} />
      <CartSheet open={sheet === "cart"} onClose={() => setSheet(null)} />
      <ServiceSheet open={sheet === "service"} onClose={() => setSheet(null)} />
      <GiftSheet open={sheet === "gift"} onClose={() => setSheet(null)} preset={giftPreset} />
      <CurrencySheet open={sheet === "currency"} onClose={() => setSheet(null)} />
      <FeedbackSheet open={sheet === "feedback"} onClose={() => setSheet(null)} />
      <LanguageSheet open={sheet === "language"} onClose={() => setSheet(null)} onPick={switchLang} />
      <GiftArrival />
      <DeepLink onOpen={openItem} />
    </div>
  );
}

function DeepLink({ onOpen }: { onOpen: (id: number) => void }) {
  useEffect(() => {
    const m = window.location.hash.match(/^#item-(\d+)$/);
    if (m) onOpen(Number(m[1]));
  }, [onOpen]);
  return null;
}

function IconBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid h-10 w-10 place-items-center rounded-full bg-black/35 text-champagne/90 backdrop-blur transition hover:bg-black/60">
      {children}
    </button>
  );
}

function DockBtn({ children, label, onClick, badge, tone }: { children: React.ReactNode; label: string; onClick: () => void; badge?: number; tone?: "rose" }) {
  return (
    <button onClick={onClick} aria-label={label} title={label}
      className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/5 transition active:scale-90 ${tone === "rose" ? "text-rose" : "text-gold"}`}>
      {children}
      {!!badge && <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-[10px] text-white">{badge}</span>}
    </button>
  );
}

function Rail({ title, kicker, children, gold }: { title: string; kicker?: string; children: React.ReactNode; gold?: boolean }) {
  return (
    <section className="mx-auto mt-14 max-w-3xl">
      <div className="px-6">
        {kicker && <div className="text-[10px] uppercase tracking-[0.4em] text-smoke">{kicker}</div>}
        <h2 className={`mt-1 font-display text-4xl ${gold ? "gold-text" : "text-champagne"}`}>{title}</h2>
      </div>
      <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 pb-2 no-scrollbar">{children}</div>
    </section>
  );
}

function SectionBanner({ cat, count }: { cat: MenuCategory; count: number }) {
  const { lang, d } = useMenu();
  const img = mediaUrl(cat.image);
  const name = loc(cat, "name", lang);
  const desc = loc(cat, "desc", lang);
  return (
    <div className="relative flex h-40 items-end img-fallback">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-60" onError={(e) => (e.currentTarget.style.display = "none")} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" />
      <div className="relative w-full p-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-[2.2rem] leading-none text-champagne">{name}</h2>
          <span className="pb-1 text-xs text-gold/80">{d.items(count)}</span>
        </div>
        {desc && <p className="mt-2 text-sm text-mist">{desc}</p>}
      </div>
    </div>
  );
}

function Petals() {
  const petals = Array.from({ length: 10 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {petals.map((_, i) => (
        <span key={i} className="absolute top-0 block rounded-[60%_0_60%_0] bg-gradient-to-br from-rose/70 to-crimson/60 animate-petal blur-[0.3px]"
          style={{
            left: `${(i * 23 + 7) % 100}%`, width: 9 + (i % 4) * 4, height: 7 + (i % 3) * 4,
            animationDuration: `${11 + (i % 5) * 3}s`, animationDelay: `${i * 1.3}s`,
            ["--drift" as string]: `${(i % 2 ? 1 : -1) * (40 + (i % 4) * 25)}px`,
          }} />
      ))}
    </div>
  );
}
