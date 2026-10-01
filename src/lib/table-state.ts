import "server-only";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";

export type TableState = Awaited<ReturnType<typeof getTableState>>;

export async function getTableState(sessionId: string, tableId: number) {
  const [guests, cart, orders, requests, giftsIn, giftsOut] = await Promise.all([
    db.select().from(s.guests).where(eq(s.guests.sessionId, sessionId)).orderBy(s.guests.createdAt),
    db.select().from(s.cartLines).where(eq(s.cartLines.sessionId, sessionId)).orderBy(s.cartLines.createdAt),
    db.select().from(s.orders)
      .where(eq(s.orders.sessionId, sessionId))
      .orderBy(desc(s.orders.createdAt)),
    db.select().from(s.serviceRequests)
      .where(and(eq(s.serviceRequests.tableId, tableId), ne(s.serviceRequests.status, "done")))
      .orderBy(desc(s.serviceRequests.createdAt)),
    db.select().from(s.gifts)
      .where(and(eq(s.gifts.toTableId, tableId), inArray(s.gifts.status, ["approved", "delivered"])))
      .orderBy(desc(s.gifts.createdAt)).limit(10),
    db.select({ g: s.gifts, toNumber: s.tables.number }).from(s.gifts)
      .innerJoin(s.tables, eq(s.tables.id, s.gifts.toTableId))
      .where(eq(s.gifts.sessionId, sessionId)).orderBy(desc(s.gifts.createdAt)),
  ]);
  const orderIds = orders.map((o) => o.id);
  const lines = orderIds.length
    ? await db.select().from(s.orderLines).where(inArray(s.orderLines.orderId, orderIds))
    : [];
  // incoming gifts only since this session started
  const [session] = await db.select().from(s.sessions).where(eq(s.sessions.id, sessionId)).limit(1);
  const since = session?.createdAt ?? new Date(0);
  return {
    sessionStatus: session?.status ?? "closed",
    guests: guests.map((g) => ({ id: g.id, name: g.name, color: g.color })),
    cart: cart.map((c) => ({ id: c.id, guestId: c.guestId, itemId: c.itemId, optionId: c.optionId, qty: c.qty, note: c.note })),
    orders: orders.map((o) => ({
      id: o.id, number: o.number, status: o.status, isGift: o.isGift, total: o.total,
      tableId: o.tableId, createdAt: o.createdAt.toISOString(),
      lines: lines.filter((l) => l.orderId === o.id).map((l) => ({
        id: l.id, itemId: l.itemId, guestId: l.guestId, nameAr: l.nameAr, nameEn: l.nameEn, nameTr: l.nameTr,
        optionName: l.optionName, unitPrice: l.unitPrice, qty: l.qty,
      })),
    })),
    requests: requests.map((r) => ({ id: r.id, type: r.type, status: r.status, createdAt: r.createdAt.toISOString() })),
    giftsIn: giftsIn.filter((g) => g.createdAt >= since).map((g) => ({
      id: g.id, itemId: g.itemId, message: g.message, senderName: g.anonymous ? null : g.senderName,
      fromTable: g.fromTableId, status: g.status, seen: !!g.seenAt,
    })),
    giftsOut: giftsOut.map(({ g, toNumber }) => ({ id: g.id, itemId: g.itemId, toTable: toNumber, status: g.status })),
  };
}
