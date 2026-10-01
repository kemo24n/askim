import { eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";

const Body = z.object({
  percent: z.number().min(-90).max(500),
  roundTo: z.number().int().min(1).max(100_000).default(10),
  categoryIds: z.array(z.number().int()).optional(),
  dryRun: z.boolean().optional(),
});

/** Raise/lower prices by a % and round to a clean step — built for inflation-era menus. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid request");
  const { percent, roundTo, categoryIds, dryRun } = p.data;
  let catIds = categoryIds;
  if (catIds?.length) {
    // include sub-categories of selected parents
    const children = await db.select({ id: s.categories.id }).from(s.categories).where(inArray(s.categories.parentId, catIds));
    catIds = [...new Set([...catIds, ...children.map((c) => c.id)])];
  }
  const rows = catIds?.length
    ? await db.select().from(s.items).where(inArray(s.items.categoryId, catIds))
    : await db.select().from(s.items);
  const changes = rows.map((r) => {
    const next = Math.max(roundTo, Math.round((r.price * (1 + percent / 100)) / roundTo) * roundTo);
    return { id: r.id, nameEn: r.nameEn, from: r.price, to: next };
  });
  if (!dryRun) {
    await db.transaction(async (tx) => {
      for (const c of changes) {
        if (c.from !== c.to) await tx.update(s.items).set({ price: c.to, updatedAt: sql`now()` }).where(eq(s.items.id, c.id));
      }
    });
  }
  return ok({ count: changes.length, changed: changes.filter((c) => c.from !== c.to).length, sample: changes.slice(0, 8) });
}
