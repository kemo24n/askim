import { and, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";

/** Close a table session (guests paid & left). Clears carts and open requests. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const [session] = await db.select().from(s.sessions).where(eq(s.sessions.id, id)).limit(1);
  if (!session) return bad("Not found", 404);
  await db.transaction(async (tx) => {
    await tx.update(s.sessions).set({ status: "closed", closedAt: new Date() }).where(eq(s.sessions.id, id));
    await tx.delete(s.cartLines).where(eq(s.cartLines.sessionId, id));
    await tx.update(s.serviceRequests).set({ status: "done", handledAt: new Date() })
      .where(and(eq(s.serviceRequests.tableId, session.tableId), ne(s.serviceRequests.status, "done")));
    await tx.update(s.orders).set({ status: "served" })
      .where(and(eq(s.orders.sessionId, id), ne(s.orders.status, "cancelled")));
  });
  return ok();
}
