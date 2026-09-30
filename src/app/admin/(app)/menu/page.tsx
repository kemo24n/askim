import { asc } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { MenuManager } from "@/components/admin/MenuManager";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [categories, items] = await Promise.all([
    db.select().from(s.categories).orderBy(asc(s.categories.sort), asc(s.categories.id)),
    db.select().from(s.items).orderBy(asc(s.items.sort), asc(s.items.id)),
  ]);
  return <MenuManager categories={categories} items={items} />;
}
