import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { getMenu } from "@/lib/menu";
import { getTableContext } from "@/lib/table";
import { getTableState } from "@/lib/table-state";
import { MenuExperience } from "@/components/guest/MenuExperience";

export const dynamic = "force-dynamic";

export default async function MenuPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [data, table] = await Promise.all([getMenu(), getTableContext()]);
  const state = table ? await getTableState(table.sessionId, table.tableId) : null;
  return <MenuExperience lang={lang} data={data} table={table} initialState={state} />;
}
