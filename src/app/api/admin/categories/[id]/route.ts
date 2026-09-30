import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";
import { CategoryInput } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = CategoryInput.partial().safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid category");
  const { id } = await params;
  const [row] = await db.update(s.categories).set(p.data).where(eq(s.categories.id, Number(id))).returning();
  return row ? ok(row) : bad("Not found", 404);
}
