import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok } from "@/lib/api";
import { getTableContext } from "@/lib/table";

const Body = z.object({ stars: z.number().int().min(1).max(5), comment: z.string().trim().max(400).optional() });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid request");
  const ctx = await getTableContext();
  await db.insert(s.feedback).values({ tableId: ctx?.tableId ?? null, stars: p.data.stars, comment: p.data.comment || null });
  return ok();
}
