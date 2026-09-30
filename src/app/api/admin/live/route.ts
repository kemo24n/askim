import { ok, requireAdmin } from "@/lib/api";
import { getLive } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return ok(await getLive());
}
