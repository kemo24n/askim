import { ok, requireAdmin } from "@/lib/api";
import { getInsights } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const days = Math.min(90, Math.max(1, Number(new URL(req.url).searchParams.get("days") ?? 14)));
  return ok(await getInsights(days));
}
