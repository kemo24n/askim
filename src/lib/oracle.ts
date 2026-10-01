/**
 * The Aşkım Oracle — composes a balanced table for a mood, party size and budget.
 * Pure function, runs on the client instantly (no AI API required).
 */
import type { MenuItem } from "./types";

export type Mood = "feast" | "light" | "grill" | "sweet" | "brunch" | "surprise";
export type Pref = "vegetarian" | "noSpicy" | "shisha" | "kids";
export type OracleInput = { mood: Mood; people: number; budget: number | null; prefs: Pref[]; seed?: number };
export type OraclePick = { item: MenuItem; qty: number; reason: Slot };
export type Slot = "mezza" | "salad" | "soup" | "main" | "grill" | "bread" | "breakfast" | "drink" | "dessert" | "shisha" | "kids";

// Category ids from the Aşkım menu
const CAT = {
  grill: 34135, kids: 34133, juices: 34141, smoothies: 34142, mojito: 34148, cold: 34149,
  hot: 34147, icedCoffee: 34146, icedTea: 38618, cocktails: 34145, pizza: 34139,
};

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

type Plan = Partial<Record<Slot, number>>;

function planFor(mood: Mood, p: number): Plan {
  const half = Math.max(1, Math.ceil(p / 2));
  const third = Math.max(1, Math.ceil(p / 3));
  switch (mood) {
    case "feast": return { mezza: Math.min(7, p + 1), salad: third, main: half, bread: p >= 4 ? 1 : 0, drink: p, dessert: half };
    case "light": return { salad: half, mezza: half, soup: p >= 3 ? 1 : 0, drink: p, dessert: p >= 4 ? 1 : 0 };
    case "grill": return { grill: Math.max(1, Math.ceil(p * 0.75)), mezza: Math.min(4, half + 1), salad: third, drink: p };
    case "sweet": return { dessert: Math.max(1, Math.ceil(p * 0.8)), drink: p };
    case "brunch": return { breakfast: Math.min(9, p + 3), bread: third, drink: p };
    case "surprise": return { mezza: Math.min(5, half + 1), main: half, salad: p >= 3 ? 1 : 0, drink: p, dessert: third };
  }
}

function drinkPool(mood: Mood, items: MenuItem[]) {
  const by = (...cats: number[]) => items.filter((i) => cats.includes(i.categoryId));
  switch (mood) {
    case "sweet": return by(CAT.hot);
    case "brunch": return by(CAT.hot, CAT.juices);
    case "light": return by(CAT.juices, CAT.smoothies, CAT.mojito, CAT.icedTea);
    case "grill": return by(CAT.cold, CAT.juices, CAT.mojito);
    default: return by(CAT.juices, CAT.mojito, CAT.cocktails, CAT.icedCoffee, CAT.cold);
  }
}

export function composeTable(all: MenuItem[], input: OracleInput): OraclePick[] {
  const rand = rng(input.seed ?? Date.now());
  const p = Math.max(1, Math.min(20, input.people));
  let pool = all.filter((i) => i.available);
  if (input.prefs.includes("vegetarian")) pool = pool.filter((i) => ["drink", "dessert", "shisha"].includes(i.role) || i.tags.includes("vegetarian"));
  if (input.prefs.includes("noSpicy")) pool = pool.filter((i) => !i.tags.includes("spicy"));
  // skip trivial add-ons & water from suggestions
  pool = pool.filter((i) => i.price >= 250 && !/pipe|head|water|مياه|أنبوب|تبديل/i.test(i.nameEn + i.nameAr));

  const plan = planFor(input.mood, p);
  if (input.prefs.includes("shisha")) plan.shisha = Math.max(1, Math.ceil(p / 3));
  if (input.prefs.includes("kids")) plan.kids = 1;

  const score = (i: MenuItem) => 1 + (i.signature ? 2.2 : 0) + Math.min(2, i.today / 6) + (input.mood === "surprise" && i.signature ? 3 : 0) + rand() * 2.4;
  const used = new Set<string>();
  const key = (i: MenuItem) => i.nameEn.toLowerCase().replace(/[^a-z]/g, "");

  const slotPool = (slot: Slot): MenuItem[] => {
    switch (slot) {
      case "grill": return pool.filter((i) => i.categoryId === CAT.grill);
      case "main": return pool.filter((i) => i.role === "main" && i.categoryId !== CAT.kids && i.categoryId !== CAT.pizza && !i.tags.includes("kids"));
      case "kids": return pool.filter((i) => i.categoryId === CAT.kids);
      case "drink": return drinkPool(input.mood, pool);
      default: return pool.filter((i) => i.role === slot);
    }
  };

  const picks: OraclePick[] = [];
  const order: Slot[] = ["breakfast", "mezza", "salad", "soup", "bread", "grill", "main", "kids", "shisha", "drink", "dessert"];
  for (const slot of order) {
    const n = plan[slot] ?? 0;
    if (!n) continue;
    const candidates = slotPool(slot).map((i) => ({ i, s: score(i) })).sort((a, b) => b.s - a.s);
    if (slot === "drink") {
      // a few different drinks, quantities spread across guests
      const kinds = Math.min(candidates.length, Math.max(1, Math.min(4, Math.ceil(n / 2))));
      const chosen: typeof candidates = [];
      for (const c of candidates) {
        if (chosen.length >= kinds) break;
        if (used.has(key(c.i))) continue;
        used.add(key(c.i));
        chosen.push(c);
      }
      chosen.forEach((c, idx) => {
        const qty = Math.floor(n / kinds) + (idx < n % kinds ? 1 : 0);
        if (qty > 0) picks.push({ item: c.i, qty, reason: slot });
      });
      continue;
    }
    let added = 0;
    for (const c of candidates) {
      if (added >= n) break;
      if (used.has(key(c.i))) continue;
      used.add(key(c.i));
      picks.push({ item: c.i, qty: 1, reason: slot });
      added++;
    }
  }

  // Budget fitting
  const total = () => picks.reduce((a, x) => a + x.item.price * x.qty, 0);
  if (input.budget) {
    const budget = input.budget;
    // 1) swap expensive items for cheaper ones of the same slot
    for (let guard = 0; guard < 40 && total() > budget; guard++) {
      const sorted = [...picks].sort((a, b) => b.item.price - a.item.price);
      let swapped = false;
      for (const pk of sorted) {
        const cheaper = slotPool(pk.reason)
          .filter((i) => i.price < pk.item.price && !used.has(key(i)))
          .sort((a, b) => b.price - a.price)[0];
        if (cheaper) {
          used.delete(key(pk.item)); used.add(key(cheaper));
          pk.item = cheaper; swapped = true; break;
        }
      }
      if (!swapped) break;
    }
    // 2) trim courses down to a sensible minimum, least essential first
    const halfP = Math.ceil(p / 2);
    const steps: [Slot, number][] = [
      ["soup", 0], ["bread", 0], ["shisha", 1], ["dessert", input.mood === "sweet" ? 1 : 0], ["mezza", 3],
      ["drink", halfP], ["shisha", 0], ["mezza", 2], ["breakfast", 3], ["salad", 1], ["main", 1], ["grill", 1], ["drink", 0],
    ];
    const count = (slot: Slot) => picks.filter((x) => x.reason === slot).reduce((a, x) => a + x.qty, 0);
    for (const [slot, floor] of steps) {
      while (total() > budget && count(slot) > floor) {
        const idx = picks.map((x) => x.reason).lastIndexOf(slot);
        if (idx < 0) break;
        if (picks[idx].qty > 1) picks[idx].qty--; else picks.splice(idx, 1);
      }
    }
  }
  return picks;
}

export const oracleTotal = (picks: OraclePick[]) => picks.reduce((a, x) => a + x.item.price * x.qty, 0);
