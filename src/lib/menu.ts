import "server-only";
import { asc, gte, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import type { MenuData, PublicSettings } from "./types";

export async function getSettings() {
  const [row] = await db.select().from(s.settings).limit(1);
  if (row) return row;
  const [created] = await db.insert(s.settings).values({ id: 1 }).returning();
  return created;
}

export function publicSettings(row: Awaited<ReturnType<typeof getSettings>>): PublicSettings {
  return {
    nameAr: row.nameAr, nameEn: row.nameEn, nameTr: row.nameTr, taglineAr: row.taglineAr, taglineEn: row.taglineEn, taglineTr: row.taglineTr,
    logoUrl: row.logoUrl, coverUrl: row.coverUrl, instagram: row.instagram, facebook: row.facebook,
    whatsapp: row.whatsapp, googleReviews: row.googleReviews, address: row.address,
    rates: { USD: row.rateUSD, EUR: row.rateEUR, TRY: row.rateTRY, AED: row.rateAED },
    showOldSYP: row.showOldSYP, serviceFeePct: row.serviceFeePct,
    giftsEnabled: row.giftsEnabled, ordersEnabled: row.ordersEnabled,
  };
}

export function startOfToday() {
  // Damascus day boundary (UTC+3)
  const now = new Date();
  const local = new Date(now.getTime() + 3 * 3600_000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - 3 * 3600_000);
}

export async function getMenu(): Promise<MenuData> {
  const [settingsRow, cats, items, options, today] = await Promise.all([
    getSettings(),
    db.select().from(s.categories).where(sql`${s.categories.active} = true`).orderBy(asc(s.categories.sort), asc(s.categories.id)),
    db.select().from(s.items).orderBy(asc(s.items.sort), asc(s.items.id)),
    db.select().from(s.itemOptions).orderBy(asc(s.itemOptions.sort)),
    db
      .select({ itemId: s.orderLines.itemId, n: sql<number>`sum(${s.orderLines.qty})::int` })
      .from(s.orderLines)
      .innerJoin(s.orders, sql`${s.orders.id} = ${s.orderLines.orderId}`)
      .where(gte(s.orders.createdAt, startOfToday()))
      .groupBy(s.orderLines.itemId),
  ]);
  const activeCats = new Set(cats.map((c) => c.id));
  const todayMap = new Map(today.map((r) => [r.itemId, r.n]));
  const optMap = new Map<number, { id: number; nameAr: string; nameEn: string; nameTr: string | null; priceDelta: number }[]>();
  for (const o of options) {
    const arr = optMap.get(o.itemId) ?? [];
    arr.push({ id: o.id, nameAr: o.nameAr, nameEn: o.nameEn, nameTr: o.nameTr, priceDelta: o.priceDelta });
    optMap.set(o.itemId, arr);
  }
  return {
    settings: publicSettings(settingsRow),
    categories: cats.map((c) => ({
      id: c.id, parentId: c.parentId, nameAr: c.nameAr, nameEn: c.nameEn, nameTr: c.nameTr, descAr: c.descAr,
      descEn: c.descEn, descTr: c.descTr, image: c.image, sort: c.sort, dayparts: c.dayparts,
    })),
    items: items
      .filter((i) => activeCats.has(i.categoryId))
      .map((i) => ({
        id: i.id, categoryId: i.categoryId, nameAr: i.nameAr, nameEn: i.nameEn, nameTr: i.nameTr, descAr: i.descAr,
        descEn: i.descEn, descTr: i.descTr, price: i.price, image: i.image, available: i.available, signature: i.signature,
        tags: i.tags, role: i.role, serves: i.serves, prepMinutes: i.prepMinutes, pairings: i.pairings,
        options: optMap.get(i.id) ?? [], today: todayMap.get(i.id) ?? 0,
      })),
  };
}
