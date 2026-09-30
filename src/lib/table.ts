import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema as s } from "@/db";
import type { TableContext } from "./types";

export const GUEST_COOKIE = "askim_guest";

export const GUEST_COLORS = ["#C9A86A", "#C2414A", "#7FB3A3", "#B28DD6", "#E3935B", "#6FA8DC", "#D98BB5", "#A3B86C"];

/** Returns the open session for a table, creating one if needed. */
export async function openSessionFor(tableId: number) {
  const [existing] = await db
    .select()
    .from(s.sessions)
    .where(and(eq(s.sessions.tableId, tableId), eq(s.sessions.status, "open")))
    .limit(1);
  if (existing) return existing;
  const [created] = await db.insert(s.sessions).values({ tableId }).returning();
  return created;
}

/** Resolves the current guest (from cookie) → guest + session + table, only if the session is still open. */
export async function getTableContext(): Promise<TableContext> {
  const jar = await cookies();
  const guestId = jar.get(GUEST_COOKIE)?.value;
  if (!guestId) return null;
  const rows = await db
    .select({ guest: s.guests, session: s.sessions, table: s.tables })
    .from(s.guests)
    .innerJoin(s.sessions, eq(s.sessions.id, s.guests.sessionId))
    .innerJoin(s.tables, eq(s.tables.id, s.sessions.tableId))
    .where(eq(s.guests.id, guestId))
    .limit(1);
  const r = rows[0];
  if (!r || r.session.status !== "open") return null;
  return {
    tableId: r.table.id, tableNumber: r.table.number, zone: r.table.zone, token: r.table.token,
    sessionId: r.session.id, guestId: r.guest.id, guestName: r.guest.name, guestColor: r.guest.color,
  };
}
