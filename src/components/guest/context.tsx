"use client";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { t, type Dict, type Lang } from "@/lib/i18n";
import { formatMoney, type Currency } from "@/lib/money";
import type { MenuData, MenuItem, TableContext } from "@/lib/types";
import type { TableState } from "@/lib/table-state";
import { useToast } from "@/components/ui/Toaster";

type Ctx = {
  lang: Lang;
  d: Dict;
  data: MenuData;
  itemsById: Map<number, MenuItem>;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  price: (n: number) => string;
  table: TableContext;
  state: TableState | null;
  refresh: () => Promise<void>;
  addToCart: (itemId: number, opts?: { optionId?: number | null; qty?: number; note?: string }) => Promise<boolean>;
  addMany: (lines: { itemId: number; qty: number }[]) => Promise<boolean>;
  setQty: (lineId: string, qty: number) => Promise<void>;
  submitOrder: () => Promise<boolean>;
  requestService: (type: string) => Promise<boolean>;
  sendGift: (p: { toTableNumber: number; itemId: number; message?: string; anonymous: boolean; senderName?: string }) => Promise<boolean>;
  markGiftSeen: (id: string) => Promise<void>;
  openItem: (id: number | null) => void;
  openedItem: number | null;
};

const MenuCtx = createContext<Ctx | null>(null);
export const useMenu = () => {
  const v = useContext(MenuCtx);
  if (!v) throw new Error("useMenu outside provider");
  return v;
};

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export function MenuProvider({
  lang, data, table, initialState, children,
}: { lang: Lang; data: MenuData; table: TableContext; initialState: TableState | null; children: ReactNode }) {
  const d = t(lang);
  const toast = useToast();
  const [currency, setCurrencyState] = useState<Currency>("SYP");
  const [state, setState] = useState<TableState | null>(initialState);
  const [openedItem, setOpenedItem] = useState<number | null>(null);
  const itemsById = useMemo(() => new Map(data.items.map((i) => [i.id, i])), [data.items]);
  const prevRef = useRef<TableState | null>(initialState);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("askim_currency") as Currency | null;
      if (saved) setCurrencyState(saved);
    } catch { /* storage unavailable */ }
  }, []);
  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem("askim_currency", c); } catch { /* ignore */ }
  }, []);
  const price = useCallback((n: number) => formatMoney(n, currency, data.settings.rates, lang), [currency, data.settings.rates, lang]);

  const refresh = useCallback(async () => {
    if (!table) return;
    try {
      const next = (await call("/api/table/state", "GET")) as TableState;
      setState(next);
    } catch { /* offline — keep last state */ }
  }, [table]);

  // Live sync
  useEffect(() => {
    if (!table) return;
    let alive = true;
    const tick = async () => { if (alive && document.visibilityState === "visible") await refresh(); };
    const iv = setInterval(tick, 2500);
    document.addEventListener("visibilitychange", tick);
    return () => { alive = false; clearInterval(iv); document.removeEventListener("visibilitychange", tick); };
  }, [table, refresh]);

  // Notify on order status changes
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = state;
    if (!prev || !state) return;
    for (const o of state.orders) {
      const before = prev.orders.find((x) => x.id === o.id);
      if (before && before.status !== o.status && (o.status === "ready" || o.status === "preparing")) {
        toast(`#${o.number} · ${d.status[o.status as keyof Dict["status"]]}`);
      }
    }
    for (const r of prev.requests) {
      if (!state.requests.find((x) => x.id === r.id)) toast(d.reqSent);
    }
    const newGuests = state.guests.filter((g) => !prev.guests.find((p) => p.id === g.id));
    for (const g of newGuests) toast(d.joined(g.name));
  }, [state, toast, d, lang]);

  const addToCart: Ctx["addToCart"] = useCallback(async (itemId, opts) => {
    if (!table) return false;
    try {
      await call("/api/table/cart", "POST", { itemId, optionId: opts?.optionId ?? null, qty: opts?.qty ?? 1, note: opts?.note ?? null });
      await refresh();
      return true;
    } catch (e) { toast((e as Error).message, "rose"); return false; }
  }, [table, refresh, toast]);

  const addMany: Ctx["addMany"] = useCallback(async (lines) => {
    if (!table) return false;
    try {
      await call("/api/table/cart", "POST", { lines });
      await refresh();
      return true;
    } catch (e) { toast((e as Error).message, "rose"); return false; }
  }, [table, refresh, toast]);

  const setQty: Ctx["setQty"] = useCallback(async (lineId, qty) => {
    setState((s) => (s ? { ...s, cart: qty <= 0 ? s.cart.filter((c) => c.id !== lineId) : s.cart.map((c) => (c.id === lineId ? { ...c, qty } : c)) } : s));
    try { await call("/api/table/cart", "PATCH", { lineId, qty }); } finally { await refresh(); }
  }, [refresh]);

  const submitOrder = useCallback(async () => {
    try { await call("/api/table/submit", "POST"); await refresh(); toast(d.sent); return true; }
    catch (e) { toast((e as Error).message, "rose"); return false; }
  }, [refresh, toast, d]);

  const requestService = useCallback(async (type: string) => {
    try { await call("/api/table/request", "POST", { type }); await refresh(); return true; }
    catch (e) { toast((e as Error).message, "rose"); return false; }
  }, [refresh, toast]);

  const sendGift: Ctx["sendGift"] = useCallback(async (p) => {
    try { await call("/api/table/gift", "POST", p); await refresh(); toast(d.giftSent); return true; }
    catch (e) { toast((e as Error).message, "rose"); return false; }
  }, [refresh, toast, d]);

  const markGiftSeen = useCallback(async (id: string) => {
    setState((s) => (s ? { ...s, giftsIn: s.giftsIn.map((g) => (g.id === id ? { ...g, seen: true } : g)) } : s));
    await call("/api/table/gift", "PATCH", { id }).catch(() => {});
  }, []);

  const openItem = useCallback((id: number | null) => {
    setOpenedItem(id);
    if (id) navigator.sendBeacon?.("/api/view", JSON.stringify({ itemId: id }));
  }, []);

  const value: Ctx = {
    lang, d, data, itemsById, currency, setCurrency, price, table, state, refresh,
    addToCart, addMany, setQty, submitOrder, requestService, sendGift, markGiftSeen, openItem, openedItem,
  };
  return <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>;
}
