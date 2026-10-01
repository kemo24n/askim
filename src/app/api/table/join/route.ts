import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok } from "@/lib/api";
import { GUEST_COLORS, GUEST_COOKIE, openSessionFor } from "@/lib/table";

const Body = z.object({ token: z.string().min(3), name: z.string().trim().min(1).max(24) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid request");
  const [table] = await db.select().from(s.tables).where(eq(s.tables.token, parsed.data.token)).limit(1);
  if (!table || !table.active) return bad("Table not found", 404);
  const session = await openSessionFor(table.id);
  const existing = await db.select({ id: s.guests.id }).from(s.guests).where(eq(s.guests.sessionId, session.id));
  const color = GUEST_COLORS[existing.length % GUEST_COLORS.length];
  const [guest] = await db.insert(s.guests).values({ sessionId: session.id, name: parsed.data.name, color }).returning();
  (await cookies()).set(GUEST_COOKIE, guest.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 10 });
  return ok({ ok: true, table: table.number });
}
