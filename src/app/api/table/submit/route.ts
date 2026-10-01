import { eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { bad, ok, requireGuest } from "@/lib/api";
import { getSettings } from "@/lib/menu";

export async function POST() {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const settings = await getSettings();
  if (!settings.ordersEnabled) return bad("Ordering is paused — please ask your waiter", 403);
  const cart = await db.select().from(s.cartLines).where(eq(s.cartLines.sessionId, ctx.sessionId));
  if (!cart.length) return bad("Cart is empty");
  const items = await db.select().from(s.items).where(inArray(s.items.id, cart.map((c) => c.itemId)));
  const optIds = cart.map((c) => c.optionId).filter((x): x is number => !!x);
  const options = optIds.length ? await db.select().from(s.itemOptions).where(inArray(s.itemOptions.id, optIds)) : [];
  const unavailable = items.filter((i) => !i.available);
  if (unavailable.length) return bad(`Unavailable: ${unavailable.map((i) => i.nameEn).join(", ")}`, 409);

  const lines = cart.map((c) => {
    const it = items.find((i) => i.id === c.itemId)!;
    const op = options.find((o) => o.id === c.optionId);
    return {
      itemId: it.id, guestId: c.guestId, nameAr: it.nameAr, nameEn: it.nameEn, nameTr: it.nameTr,
      optionName: op ? `${op.nameEn} · ${op.nameAr}` : null,
      unitPrice: it.price + (op?.priceDelta ?? 0), qty: c.qty, note: c.note,
    };
  });
  const total = lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const order = await db.transaction(async (tx) => {
    const [o] = await tx.insert(s.orders).values({ sessionId: ctx.sessionId, tableId: ctx.tableId, total }).returning();
    await tx.insert(s.orderLines).values(lines.map((l) => ({ ...l, orderId: o.id })));
    await tx.delete(s.cartLines).where(eq(s.cartLines.sessionId, ctx.sessionId));
    return o;
  });
  return ok({ ok: true, number: order.number });
}
