export const syp = (n: number) => `${new Intl.NumberFormat("en-US").format(n)} SYP`;
export const usd = (n: number, rate: number) => `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: n / rate < 100 ? 1 : 0 }).format(n / rate)}`;
export function ago(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
export const REQ_LABEL: Record<string, string> = {
  waiter: "Call waiter", bill: "Bill please", coal: "Fresh coal", water: "Water", napkins: "Napkins", clean: "Clear table",
};
export const REQ_EMOJI: Record<string, string> = { waiter: "🛎️", bill: "🧾", coal: "🔥", water: "💧", napkins: "🧻", clean: "✨" };
export async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}
