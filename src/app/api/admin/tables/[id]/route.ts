import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";

const Body = z.object({
  zone: z.string().trim().min(1).max(40).optional(),
  seats: z.number().int().min(1).max(40).optional(),
  active: z.boolean().optional(),
  regenerate: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid table");
  const { id } = await params;
  const { regenerate, ...rest } = p.data;
  const [t] = await db.select().from(s.tables).where(eq(s.tables.id, Number(id))).limit(1);
  if (!t) return bad("Not found", 404);
  const token = regenerate ? `t${t.number}-${randomBytes(4).toString("hex")}` : undefined;
  await db.update(s.tables).set({ ...rest, ...(token ? { token } : {}) }).where(eq(s.tables.id, t.id));
  return ok();
}
