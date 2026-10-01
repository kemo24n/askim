import { bad, ok, requireGuest } from "@/lib/api";
import { getTableState } from "@/lib/table-state";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireGuest();
  if (!ctx) return bad("Not seated", 401);
  return ok(await getTableState(ctx.sessionId, ctx.tableId));
}
