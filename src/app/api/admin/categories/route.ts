import { CategoryInput } from "@/lib/validators";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";


export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = CategoryInput.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid category");
  const [row] = await db.insert(s.categories).values(p.data).returning();
  return ok(row);
}
