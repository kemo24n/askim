import type { Lang } from "./i18n";

export type Currency = "SYP" | "OLD" | "USD" | "EUR" | "TRY" | "AED";
export const CURRENCIES: Currency[] = ["SYP", "OLD", "USD", "EUR", "TRY", "AED"];

export type Rates = { USD: number; EUR: number; TRY: number; AED: number };

const SYMBOL: Record<Currency, { ar: string; en: string }> = {
  SYP: { ar: "ل.س", en: "SYP" },
  OLD: { ar: "ل.س ق", en: "old SYP" },
  USD: { ar: "$", en: "$" },
  EUR: { ar: "€", en: "€" },
  TRY: { ar: "₺", en: "₺" },
  AED: { ar: "د.إ", en: "AED" },
};
export const currencyLabel = (c: Currency, l: Lang) =>
  ({
    SYP: l === "ar" ? "ليرة جديدة" : "New SYP",
    OLD: l === "ar" ? "ليرة قديمة" : "Old SYP",
    USD: l === "ar" ? "دولار" : "US Dollar",
    EUR: l === "ar" ? "يورو" : "Euro",
    TRY: l === "ar" ? "ليرة تركية" : "Turkish Lira",
    AED: l === "ar" ? "درهم" : "UAE Dirham",
  })[c];

/** price is in NEW Syrian pounds */
export function convert(price: number, c: Currency, rates: Rates): number {
  if (c === "SYP") return price;
  if (c === "OLD") return price * 100;
  return price / rates[c];
}

export function formatMoney(price: number, c: Currency, rates: Rates, l: Lang): string {
  const v = convert(price, c, rates);
  const digits = c === "SYP" || c === "OLD" ? 0 : v < 100 ? 2 : 0;
  const n = new Intl.NumberFormat(l === "ar" ? "ar-SY" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
  const sym = SYMBOL[c][l];
  if (c === "USD" || c === "EUR") return l === "ar" ? `${n} ${sym}` : `${sym}${n}`;
  return `${n} ${sym}`;
}
