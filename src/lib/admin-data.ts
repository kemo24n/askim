import "server-only";
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { startOfToday } from "./menu";

export type LiveData = Awaited<ReturnType<typeof getLive>>;

export async function getLive() {
  const today = startOfToday();
  const [tables, openSessions, activeOrders, requests, pendingGifts, todayAgg, carts, guests] = await Promise.all([
    db.select().from(s.tables).orderBy(s.tables.number),
    db.select().from(s.sessions).where(eq(s.sessions.status, "open")),
    db.select().from(s.orders).where(inArray(s.orders.status, ["new", "preparing", "ready"])).orderBy(s.orders.createdAt),
    db.select().from(s.serviceRequests).where(ne(s.serviceRequests.status, "done")).orderBy(s.serviceRequests.createdAt),
    db.select({ g: s.gifts, item: s.items }).from(s.gifts).innerJoin(s.items, eq(s.items.id, s.gifts.itemId))
      .where(eq(s.gifts.status, "pending")).orderBy(s.gifts.createdAt),
    db.select({
      revenue: sql<number>`coalesce(sum(${s.orders.total}), 0)::int`,
      count: sql<number>`count(*)::int`,
    }).from(s.orders).where(and(gte(s.orders.createdAt, today), ne(s.orders.status, "cancelled"))),
    db.select({ sessionId: s.cartLines.sessionId, n: sql<number>`sum(${s.cartLines.qty})::int` }).from(s.cartLines).groupBy(s.cartLines.sessionId),
    db.select({ sessionId: s.guests.sessionId, id: s.guests.id, name: s.guests.name, color: s.guests.color }).from(s.guests)
      .innerJoin(s.sessions, eq(s.sessions.id, s.guests.sessionId)).where(eq(s.sessions.status, "open")),
  ]);
  const lines = activeOrders.length
    ? await db.select().from(s.orderLines).where(inArray(s.orderLines.orderId, activeOrders.map((o) => o.id)))
    : [];
  const sessionIds = openSessions.map((x) => x.id);
  const sessionTotals = sessionIds.length
    ? await db.select({ sessionId: s.orders.sessionId, total: sql<number>`coalesce(sum(${s.orders.total}),0)::int` })
        .from(s.orders).where(and(inArray(s.orders.sessionId, sessionIds), ne(s.orders.status, "cancelled"))).groupBy(s.orders.sessionId)
    : [];
  const tableNum = new Map(tables.map((t) => [t.id, t.number]));

  return {
    now: new Date().toISOString(),
    kpis: {
      revenue: todayAgg[0]?.revenue ?? 0,
      orders: todayAgg[0]?.count ?? 0,
      seated: openSessions.length,
      tables: tables.filter((t) => t.active).length,
      guests: guests.length,
      openRequests: requests.length,
      activeOrders: activeOrders.length,
    },
    tables: tables.map((t) => {
      const sess = openSessions.find((x) => x.tableId === t.id);
      return {
        id: t.id, number: t.number, zone: t.zone, seats: t.seats, token: t.token, active: t.active,
        session: sess ? {
          id: sess.id,
          since: sess.createdAt.toISOString(),
          guests: guests.filter((g) => g.sessionId === sess.id).map((g) => ({ id: g.id, name: g.name, color: g.color })),
          cartQty: carts.find((c) => c.sessionId === sess.id)?.n ?? 0,
          total: sessionTotals.find((x) => x.sessionId === sess.id)?.total ?? 0,
        } : null,
        requests: requests.filter((r) => r.tableId === t.id).map((r) => r.type),
        activeOrders: activeOrders.filter((o) => o.tableId === t.id).length,
      };
    }),
    orders: activeOrders.map((o) => ({
      id: o.id, number: o.number, status: o.status, isGift: o.isGift, total: o.total,
      table: tableNum.get(o.tableId) ?? 0, createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
      lines: lines.filter((l) => l.orderId === o.id).map((l) => ({ id: l.id, nameAr: l.nameAr, nameEn: l.nameEn, qty: l.qty, note: l.note, optionName: l.optionName })),
    })),
    requests: requests.map((r) => ({ id: r.id, type: r.type, status: r.status, table: tableNum.get(r.tableId) ?? 0, createdAt: r.createdAt.toISOString() })),
    gifts: pendingGifts.map(({ g, item }) => ({
      id: g.id, from: tableNum.get(g.fromTableId) ?? 0, to: tableNum.get(g.toTableId) ?? 0,
      itemAr: item.nameAr, itemEn: item.nameEn, price: item.price, message: g.message,
      sender: g.anonymous ? null : g.senderName, createdAt: g.createdAt.toISOString(),
    })),
  };
}

export type Insights = Awaited<ReturnType<typeof getInsights>>;

export async function getInsights(days: number) {
  const since = new Date(startOfToday().getTime() - (days - 1) * 86400_000);
  const notCancelled = and(gte(s.orders.createdAt, since), ne(s.orders.status, "cancelled"));
  const tz = sql`'Asia/Damascus'`;
  const [daily, hourly, top, views, ratings, recentFeedback, byCategory] = await Promise.all([
    db.select({
      day: sql<string>`to_char(${s.orders.createdAt} at time zone ${tz}, 'YYYY-MM-DD')`,
      revenue: sql<number>`sum(${s.orders.total})::int`,
      orders: sql<number>`count(*)::int`,
    }).from(s.orders).where(notCancelled).groupBy(sql`1`).orderBy(sql`1`),
    db.select({
      dow: sql<number>`extract(isodow from ${s.orders.createdAt} at time zone ${tz})::int`,
      hour: sql<number>`extract(hour from ${s.orders.createdAt} at time zone ${tz})::int`,
      orders: sql<number>`count(*)::int`,
    }).from(s.orders).where(notCancelled).groupBy(sql`1`, sql`2`),
    db.select({
      itemId: s.orderLines.itemId,
      nameEn: s.orderLines.nameEn,
      nameAr: s.orderLines.nameAr,
      qty: sql<number>`sum(${s.orderLines.qty})::int`,
      revenue: sql<number>`sum(${s.orderLines.qty} * ${s.orderLines.unitPrice})::int`,
    }).from(s.orderLines).innerJoin(s.orders, eq(s.orders.id, s.orderLines.orderId)).where(notCancelled)
      .groupBy(s.orderLines.itemId, s.orderLines.nameEn, s.orderLines.nameAr).orderBy(desc(sql`5`)).limit(12),
    db.select({ itemId: s.itemViews.itemId, views: sql<number>`count(*)::int` }).from(s.itemViews)
      .where(gte(s.itemViews.createdAt, since)).groupBy(s.itemViews.itemId),
    db.select({ avg: sql<number>`coalesce(avg(${s.feedback.stars}),0)::float`, n: sql<number>`count(*)::int` }).from(s.feedback)
      .where(gte(s.feedback.createdAt, since)),
    db.select().from(s.feedback).where(and(gte(s.feedback.createdAt, since), sql`${s.feedback.comment} is not null`))
      .orderBy(desc(s.feedback.createdAt)).limit(6),
    db.select({
      categoryId: s.items.categoryId,
      revenue: sql<number>`sum(${s.orderLines.qty} * ${s.orderLines.unitPrice})::int`,
    }).from(s.orderLines).innerJoin(s.orders, eq(s.orders.id, s.orderLines.orderId)).innerJoin(s.items, eq(s.items.id, s.orderLines.itemId))
      .where(notCancelled).groupBy(s.items.categoryId),
  ]);

  // conversion: views vs orders per item
  const ordered = await db.select({ itemId: s.orderLines.itemId, qty: sql<number>`sum(${s.orderLines.qty})::int` })
    .from(s.orderLines).innerJoin(s.orders, eq(s.orders.id, s.orderLines.orderId)).where(notCancelled).groupBy(s.orderLines.itemId);
  const items = await db.select({ id: s.items.id, nameEn: s.items.nameEn, nameAr: s.items.nameAr, price: s.items.price, image: s.items.image, categoryId: s.items.categoryId }).from(s.items);
  const cats = await db.select().from(s.categories);
  const oMap = new Map(ordered.map((o) => [o.itemId, o.qty]));
  const gap = views
    .map((v) => {
      const it = items.find((i) => i.id === v.itemId);
      const o = oMap.get(v.itemId) ?? 0;
      return it ? { itemId: v.itemId, nameEn: it.nameEn, nameAr: it.nameAr, image: it.image, price: it.price, views: v.views, orders: o, conversion: v.views ? o / v.views : 0 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x && x.views >= 40)
    .sort((a, b) => a.conversion - b.conversion)
    .slice(0, 6);

  // roll categories up to their top-level group
  const topOf = (id: number): number => {
    const c = cats.find((x) => x.id === id);
    return c?.parentId ? topOf(c.parentId) : id;
  };
  const groupRevenue = new Map<number, number>();
  for (const r of byCategory) {
    const leaf = cats.find((c) => c.id === r.categoryId);
    const key = leaf?.parentId ? leaf.id : topOf(r.categoryId);
    groupRevenue.set(key, (groupRevenue.get(key) ?? 0) + r.revenue);
  }

  const totalRevenue = daily.reduce((a, d) => a + d.revenue, 0);
  const totalOrders = daily.reduce((a, d) => a + d.orders, 0);
  return {
    days,
    totalRevenue,
    totalOrders,
    avgTicket: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
    daily,
    hourly,
    top,
    gap,
    rating: { avg: Number((ratings[0]?.avg ?? 0).toFixed(2)), count: ratings[0]?.n ?? 0 },
    feedback: recentFeedback.map((f) => ({ id: f.id, stars: f.stars, comment: f.comment, createdAt: f.createdAt.toISOString() })),
    categories: [...groupRevenue.entries()]
      .map(([id, revenue]) => ({ id, nameEn: cats.find((c) => c.id === id)?.nameEn ?? "—", revenue }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}
