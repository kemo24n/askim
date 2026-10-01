import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";

const Body = z.object({ zone: z.string().trim().min(1).max(40), seats: z.number().int().min(1).max(40), count: z.number().int().min(1).max(50).default(1) });

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid table");
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${s.tables.number}), 0)::int` }).from(s.tables);
  const rows = Array.from({ length: p.data.count }, (_, i) => {
    const n = max + i + 1;
    return { number: n, zone: p.data.zone, seats: p.data.seats, token: `t${n}-${randomBytes(4).toString("hex")}` };
  });
  await db.insert(s.tables).values(rows);
  return ok({ added: rows.length });
}
