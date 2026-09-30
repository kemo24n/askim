import { localeOf, type Lang } from "./i18n";

export type Currency = "SYP" | "OLD" | "USD" | "EUR" | "TRY" | "AED";
export const CURRENCIES: Currency[] = ["SYP", "OLD", "USD", "EUR", "TRY", "AED"];

export type Rates = { USD: number; EUR: number; TRY: number; AED: number };

const SYMBOL: Record<Currency, Record<Lang, string>> = {
  SYP: { ar: "ل.س", tr: "SYP", en: "SYP" },
  OLD: { ar: "ل.س ق", tr: "eski SYP", en: "old SYP" },
  USD: { ar: "$", tr: "$", en: "$" },
  EUR: { ar: "€", tr: "€", en: "€" },
  TRY: { ar: "₺", tr: "₺", en: "₺" },
  AED: { ar: "د.إ", tr: "AED", en: "AED" },
};
const LABELS: Record<Currency, Record<Lang, string>> = {
  SYP: { ar: "ليرة جديدة", tr: "Yeni Suriye Lirası", en: "New SYP" },
  OLD: { ar: "ليرة قديمة", tr: "Eski Suriye Lirası", en: "Old SYP" },
  USD: { ar: "دولار", tr: "ABD Doları", en: "US Dollar" },
  EUR: { ar: "يورو", tr: "Euro", en: "Euro" },
  TRY: { ar: "ليرة تركية", tr: "Türk Lirası", en: "Turkish Lira" },
  AED: { ar: "درهم", tr: "BAE Dirhemi", en: "UAE Dirham" },
};
export const currencyLabel = (c: Currency, l: Lang) => LABELS[c][l];

/** price is in NEW Syrian pounds */
export function convert(price: number, c: Currency, rates: Rates): number {
  if (c === "SYP") return price;
  if (c === "OLD") return price * 100;
  return price / rates[c];
}

export function formatMoney(price: number, c: Currency, rates: Rates, l: Lang): string {
  const v = convert(price, c, rates);
  const digits = c === "SYP" || c === "OLD" ? 0 : v < 100 ? 2 : 0;
  const n = new Intl.NumberFormat(localeOf(l), {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
  const sym = SYMBOL[c][l];
  if (c === "USD" || c === "EUR") return l === "en" ? `${sym}${n}` : `${n} ${sym}`;
  if (c === "TRY" && l === "tr") return `${sym}${n}`;
  return `${n} ${sym}`;
}
