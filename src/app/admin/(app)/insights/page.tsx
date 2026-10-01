import { getInsights } from "@/lib/admin-data";
import { InsightsView } from "@/components/admin/InsightsView";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { days } = await searchParams;
  const n = Math.min(90, Math.max(1, Number(days ?? 14) || 14));
  return <InsightsView data={await getInsights(n)} />;
}
