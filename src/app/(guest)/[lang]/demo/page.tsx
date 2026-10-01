import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db, schema as s } from "@/db";
import { isLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

/** Pitch shortcut: seats you at table 7. */
export default async function Demo({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [table] = await db.select().from(s.tables).where(eq(s.tables.number, 7)).limit(1);
  if (!table) notFound();
  redirect(`/${lang}/t/${table.token}`);
}
