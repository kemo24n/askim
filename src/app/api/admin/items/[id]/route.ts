import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";
import { ItemInput } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = ItemInput.partial().safeParse(await req.json().catch(() => null));
  if (!p.success) return bad(p.error.issues[0]?.message ?? "Invalid item");
  const { id } = await params;
  const [row] = await db.update(s.items).set({ ...p.data, updatedAt: new Date() }).where(eq(s.items.id, Number(id))).returning();
  return row ? ok(row) : bad("Not found", 404);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  await db.delete(s.items).where(eq(s.items.id, Number(id)));
  return ok();
}
