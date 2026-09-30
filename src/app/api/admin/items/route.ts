import { ItemInput } from "@/lib/validators";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";


export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = ItemInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad(p.error.issues[0]?.message ?? "Invalid item");
  const [row] = await db.insert(s.items).values(p.data).returning();
  return ok(row);
}
