import { and, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { bad, ok, requireGuest } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Seated tables a guest can send a gift to (numbers + zone only). */
export async function GET() {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const rows = await db
    .selectDistinct({ number: s.tables.number, zone: s.tables.zone })
    .from(s.sessions)
    .innerJoin(s.tables, eq(s.tables.id, s.sessions.tableId))
    .where(and(eq(s.sessions.status, "open"), ne(s.tables.id, ctx.tableId)))
    .orderBy(s.tables.number);
  return ok(rows);
}
