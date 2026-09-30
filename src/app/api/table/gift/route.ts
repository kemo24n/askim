import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireGuest } from "@/lib/api";
import { getSettings } from "@/lib/menu";

const Body = z.object({
  toTableNumber: z.number().int(),
  itemId: z.number().int(),
  message: z.string().trim().max(160).optional(),
  anonymous: z.boolean(),
  senderName: z.string().trim().max(30).optional(),
});

export async function POST(req: Request) {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const settings = await getSettings();
  if (!settings.giftsEnabled) return bad("Gifts are not available right now", 403);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid request");
  const [to] = await db.select().from(s.tables).where(eq(s.tables.number, p.data.toTableNumber)).limit(1);
  if (!to || to.id === ctx.tableId) return bad("Choose another table");
  const [open] = await db.select().from(s.sessions).where(and(eq(s.sessions.tableId, to.id), eq(s.sessions.status, "open"))).limit(1);
  if (!open) return bad("That table isn’t seated right now");
  const [item] = await db.select().from(s.items).where(eq(s.items.id, p.data.itemId)).limit(1);
  if (!item?.available) return bad("Item unavailable", 409);
  await db.insert(s.gifts).values({
    fromTableId: ctx.tableId, toTableId: to.id, itemId: item.id, sessionId: ctx.sessionId, guestId: ctx.guestId,
    message: p.data.message || null, anonymous: p.data.anonymous, senderName: p.data.anonymous ? null : p.data.senderName || ctx.guestName,
  });
  return ok();
}

export async function PATCH(req: Request) {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return bad("Invalid request");
  await db.update(s.gifts).set({ seenAt: new Date() }).where(and(eq(s.gifts.id, id), eq(s.gifts.toTableId, ctx.tableId)));
  return ok();
}
