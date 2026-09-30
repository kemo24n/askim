import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";

const Body = z.object({ status: z.enum(["open", "ack", "done"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad("Invalid status");
  const { id } = await params;
  await db.update(s.serviceRequests).set({ status: p.data.status, handledAt: new Date() }).where(eq(s.serviceRequests.id, id));
  return ok();
}
