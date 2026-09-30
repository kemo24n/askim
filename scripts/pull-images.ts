/* eslint-disable no-console */
/**
 * Downloads every menu photo from the current eMenu CDN into /public/media
 * so the platform no longer depends on the old provider.
 *   npm run images:pull
 * Then set NEXT_PUBLIC_MEDIA_BASE="/media" in .env and restart.
 */
import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { db, schema as s } from "../src/db";

const SOURCE = "https://cdn.emenu.ae/media";
const OUT = join(process.cwd(), "public", "media");

async function exists(p: string) { try { await access(p); return true; } catch { return false; } }

async function main() {
  const [items, cats, settings] = await Promise.all([
    db.select({ image: s.items.image }).from(s.items),
    db.select({ image: s.categories.image }).from(s.categories),
    db.select({ a: s.settings.logoUrl, b: s.settings.coverUrl }).from(s.settings),
  ]);
  const paths = [...new Set([...items.map((i) => i.image), ...cats.map((c) => c.image), ...settings.flatMap((x) => [x.a, x.b])]
    .filter((p): p is string => !!p && !/^https?:/.test(p) && !p.startsWith("/")))];
  console.log(`› ${paths.length} images`);
  let ok = 0, skipped = 0, failed = 0;
  const queue = [...paths];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const p = queue.shift()!;
      const dest = join(OUT, p);
      if (await exists(dest)) { skipped++; continue; }
      try {
        const res = await fetch(`${SOURCE}/${p.split("/").map(encodeURIComponent).join("/")}`);
        if (!res.ok) throw new Error(String(res.status));
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, Buffer.from(await res.arrayBuffer()));
        ok++;
      } catch (e) { failed++; console.warn(`  ✗ ${p} (${(e as Error).message})`); }
    }
  }));
  console.log(`✓ downloaded ${ok}, already had ${skipped}, failed ${failed}`);
  console.log('Now set NEXT_PUBLIC_MEDIA_BASE="/media" in .env');
  process.exit(0);
}
main();
