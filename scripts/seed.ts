/* eslint-disable no-console */
/**
 * Seeds the full Aşkım menu (29 categories · 270 items, AR + EN) and 28 tables.
 * Adds two weeks of demo activity so the dashboard is alive during a pitch.
 *   npm run db:seed              → menu + tables + demo activity
 *   npm run db:seed -- --no-demo → menu + tables only
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { db, schema as s } from "../src/db";

type SeedCategory = {
  id: number; parentId: number | null; sort: number; nameAr: string; nameEn: string;
  descAr: string | null; descEn: string | null; image: string | null; dayparts: string[];
};
type SeedItem = {
  id: number; categoryId: number; sort: number; nameAr: string; nameEn: string;
  descAr: string | null; descEn: string | null; price: number; image: string | null;
  role: string; tags: string[]; signature: boolean; serves: number; prepMinutes: number;
  pairings: number[]; options: { nameAr: string; nameEn: string; priceDelta: number; sort: number }[];
};

const data = JSON.parse(readFileSync(join(process.cwd(), "src/db/data/askim-menu.json"), "utf8")) as {
  logo: string; cover: string; categories: SeedCategory[]; items: SeedItem[];
};
const withDemo = !process.argv.includes("--no-demo");

async function main() {
  console.log("› Clearing database…");
  await db.execute(sql`TRUNCATE feedback, item_views, gifts, service_requests, order_lines, orders,
    cart_lines, guests, table_sessions, dining_tables, item_options, items, categories, settings
    RESTART IDENTITY CASCADE`);

  await db.insert(s.settings).values({
    id: 1,
    logoUrl: data.logo,
    coverUrl: data.cover,
    instagram: "https://www.instagram.com/askim.restaurant/",
    facebook: "https://www.facebook.com/askim.restaurant",
    address: "Damascus, Syria",
  });

  // categories: parents first
  const cats = [...data.categories].sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId));
  await db.insert(s.categories).values(cats);
  console.log(`› Categories: ${cats.length}`);

  const itemRows = data.items.map(({ options: _o, ...rest }) => rest);
  for (let i = 0; i < itemRows.length; i += 100) await db.insert(s.items).values(itemRows.slice(i, i + 100));
  const opts = data.items.flatMap((it) => it.options.map((o) => ({ ...o, itemId: it.id })));
  if (opts.length) await db.insert(s.itemOptions).values(opts);
  console.log(`› Items: ${itemRows.length} (${opts.length} options)`);

  await db.execute(sql`SELECT setval(pg_get_serial_sequence('categories','id'), (SELECT MAX(id) FROM categories))`);
  await db.execute(sql`SELECT setval(pg_get_serial_sequence('items','id'), (SELECT MAX(id) FROM items))`);

  const zones = [
    { zone: "Main hall", from: 1, to: 10, seats: 4 },
    { zone: "Garden", from: 11, to: 18, seats: 4 },
    { zone: "Terrace", from: 19, to: 24, seats: 6 },
    { zone: "Private lounge", from: 25, to: 28, seats: 8 },
  ];
  const tableRows = zones.flatMap((z) =>
    Array.from({ length: z.to - z.from + 1 }, (_, k) => {
      const n = z.from + k;
      return { number: n, zone: z.zone, seats: z.seats, token: `t${n}-${randomBytes(4).toString("hex")}` };
    }),
  );
  await db.insert(s.tables).values(tableRows);
  console.log(`› Tables: ${tableRows.length}`);

  if (withDemo) await seedDemoActivity();
  console.log("✓ Done");
}

async function seedDemoActivity() {
  console.log("› Demo activity (two weeks)…");
  const items = await db.select().from(s.items);
  const tbls = await db.select().from(s.tables);
  const signature = items.filter((i) => i.signature);
  const popular = items.filter((i) => ["main", "mezza", "drink", "shisha", "dessert", "salad"].includes(i.role));
  const rand = (n: number) => Math.floor(Math.random() * n);
  const pick = <T,>(arr: T[]) => arr[rand(arr.length)];
  const hourWeight = [1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 3, 3, 4, 4, 3, 3, 4, 6, 8, 9, 9, 7, 4];
  const totalW = hourWeight.reduce((a, b) => a + b, 0);
  const weightedHour = () => {
    let r = Math.random() * totalW;
    for (let h = 0; h < 24; h++) { r -= hourWeight[h]; if (r <= 0) return h; }
    return 20;
  };
  const now = new Date();
  const orderRows: (typeof s.orders.$inferInsert)[] = [];
  const lineRows: (typeof s.orderLines.$inferInsert)[] = [];
  const viewRows: (typeof s.itemViews.$inferInsert)[] = [];

  for (let day = 13; day >= 0; day--) {
    const n = 26 + rand(20) + (day % 7 === 3 || day % 7 === 4 ? 14 : 0); // busier weekends
    for (let o = 0; o < n; o++) {
      const at = new Date(now);
      at.setDate(now.getDate() - day);
      at.setHours(weightedHour(), rand(60), rand(60), 0);
      if (at > now) continue;
      const orderId = crypto.randomUUID();
      const lc = 2 + rand(5);
      let total = 0;
      for (let l = 0; l < lc; l++) {
        const it = Math.random() < 0.5 ? pick(signature) : pick(popular);
        const qty = Math.random() < 0.25 ? 2 : 1;
        total += it.price * qty;
        lineRows.push({ orderId, itemId: it.id, nameAr: it.nameAr, nameEn: it.nameEn, unitPrice: it.price, qty });
        for (let v = 0; v < 2 + rand(3); v++) viewRows.push({ itemId: it.id, createdAt: at });
      }
      for (let v = 0; v < 3 + rand(6); v++) viewRows.push({ itemId: pick(items).id, createdAt: at });
      orderRows.push({ id: orderId, tableId: pick(tbls).id, status: "served", total, createdAt: at, updatedAt: at });
    }
  }
  // A few dishes that get looked at a lot but rarely ordered — the "insight" moment in the pitch
  for (const id of [216519, 216523, 216474]) {
    for (let v = 0; v < 160; v++) viewRows.push({ itemId: id, createdAt: new Date(now.getTime() - rand(13) * 86400000) });
  }
  const chunk = async <T,>(rows: T[], fn: (r: T[]) => Promise<unknown>) => {
    for (let i = 0; i < rows.length; i += 500) await fn(rows.slice(i, i + 500));
  };
  await chunk(orderRows, (r) => db.insert(s.orders).values(r));
  await chunk(lineRows, (r) => db.insert(s.orderLines).values(r));
  await chunk(viewRows, (r) => db.insert(s.itemViews).values(r));

  const comments = ["الكنافة خرافية 😍", "Iskender was unreal", "خدمة سريعة ولطيفة", "Loved the shisha and the vibe", "الأجواء رائعة", "أطيب حمص أشكم"];
  await db.insert(s.feedback).values(
    Array.from({ length: 46 }, () => ({
      tableId: pick(tbls).id,
      stars: Math.random() < 0.78 ? 5 : Math.random() < 0.8 ? 4 : 3,
      comment: Math.random() < 0.45 ? pick(comments) : null,
      createdAt: new Date(now.getTime() - rand(14) * 86400000),
    })),
  );
  console.log(`  ${orderRows.length} orders · ${viewRows.length} views`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
