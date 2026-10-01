import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireGuest } from "@/lib/api";

const Body = z.object({ type: z.enum(["waiter", "bill", "coal", "water", "napkins", "clean"]) });

export async function POST(req: Request) {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid request");
  const [dupe] = await db.select().from(s.serviceRequests).where(and(
    eq(s.serviceRequests.tableId, ctx.tableId), eq(s.serviceRequests.type, p.data.type), ne(s.serviceRequests.status, "done"),
  ));
  if (!dupe) await db.insert(s.serviceRequests).values({ tableId: ctx.tableId, sessionId: ctx.sessionId, type: p.data.type });
  return ok();
}
