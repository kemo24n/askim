import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireGuest } from "@/lib/api";

const One = z.object({
  itemId: z.number().int(),
  optionId: z.number().int().nullable().optional(),
  qty: z.number().int().min(1).max(30).default(1),
  note: z.string().max(140).nullable().optional(),
});
const Many = z.object({ lines: z.array(z.object({ itemId: z.number().int(), qty: z.number().int().min(1).max(30) })).min(1).max(40) });

export async function POST(req: Request) {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const body = await req.json().catch(() => null);
  const many = Many.safeParse(body);
  const lines = many.success ? many.data.lines.map((l) => ({ ...l, optionId: null, note: null })) : null;
  const one = lines ? null : One.safeParse(body);
  if (!lines && !one?.success) return bad("Invalid request");
  const rows = lines ?? [one!.data!];
  const ids = [...new Set(rows.map((r) => r.itemId))];
  const found = await db.select({ id: s.items.id, available: s.items.available }).from(s.items).where(inArray(s.items.id, ids));
  if (found.length !== ids.length || found.some((f) => !f.available)) return bad("Item unavailable", 409);

  for (const r of rows) {
    // merge identical lines from the same guest
    const [same] = await db.select().from(s.cartLines).where(and(
      eq(s.cartLines.sessionId, ctx.sessionId), eq(s.cartLines.guestId, ctx.guestId), eq(s.cartLines.itemId, r.itemId),
    ));
    if (same && (same.optionId ?? null) === (r.optionId ?? null) && !same.note && !r.note) {
      await db.update(s.cartLines).set({ qty: Math.min(30, same.qty + r.qty) }).where(eq(s.cartLines.id, same.id));
    } else {
      await db.insert(s.cartLines).values({
        sessionId: ctx.sessionId, guestId: ctx.guestId, itemId: r.itemId, optionId: r.optionId ?? null, qty: r.qty, note: r.note ?? null,
      });
    }
  }
  return ok();
}

const Patch = z.object({ lineId: z.string(), qty: z.number().int().min(0).max(30) });

export async function PATCH(req: Request) {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const p = Patch.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid request");
  const where = and(eq(s.cartLines.id, p.data.lineId), eq(s.cartLines.sessionId, ctx.sessionId));
  if (p.data.qty === 0) await db.delete(s.cartLines).where(where);
  else await db.update(s.cartLines).set({ qty: p.data.qty }).where(where);
  return ok();
}
