import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { isLang } from "@/lib/i18n";
import { getSettings } from "@/lib/menu";
import { getTableContext } from "@/lib/table";
import { JoinTable } from "@/components/guest/JoinTable";

export const dynamic = "force-dynamic";

export default async function TableEntry({ params }: { params: Promise<{ lang: string; token: string }> }) {
  const { lang, token } = await params;
  if (!isLang(lang)) notFound();
  const [table] = await db.select().from(s.tables).where(eq(s.tables.token, token)).limit(1);
  if (!table || !table.active) notFound();
  const ctx = await getTableContext();
  if (ctx && ctx.tableId === table.id) redirect(`/${lang}`);
  const settings = await getSettings();
  return <JoinTable lang={lang} token={token} tableNumber={table.number} zone={table.zone} coverUrl={settings.coverUrl} />;
}
