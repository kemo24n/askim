import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";

const Body = z.object({ status: z.enum(["approved", "delivered", "declined"]) });

/** Approving a gift sends it to the kitchen (delivered to the recipient table, billed to the sender's session). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid status");
  const { id } = await params;
  const [gift] = await db.select().from(s.gifts).where(eq(s.gifts.id, id)).limit(1);
  if (!gift) return bad("Not found", 404);
  if (p.data.status === "approved" && gift.status === "pending") {
    const [item] = await db.select().from(s.items).where(eq(s.items.id, gift.itemId)).limit(1);
    await db.transaction(async (tx) => {
      const [order] = await tx.insert(s.orders).values({
        sessionId: gift.sessionId, tableId: gift.toTableId, isGift: true, total: item.price,
      }).returning();
      await tx.insert(s.orderLines).values({
        orderId: order.id, itemId: item.id, guestId: gift.guestId, nameAr: item.nameAr, nameEn: item.nameEn, nameTr: item.nameTr,
        unitPrice: item.price, qty: 1, note: gift.message ? `🌹 ${gift.message}` : "🌹 Gift",
      });
      await tx.update(s.gifts).set({ status: "approved" }).where(eq(s.gifts.id, id));
    });
  } else {
    await db.update(s.gifts).set({ status: p.data.status }).where(eq(s.gifts.id, id));
  }
  return ok();
}
