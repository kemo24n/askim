import { db, schema as s } from "@/db";

export async function POST(req: Request) {
  try {
    const { itemId } = JSON.parse(await req.text()) as { itemId?: number };
    if (Number.isInteger(itemId)) await db.insert(s.itemViews).values({ itemId: itemId! });
  } catch { /* ignore malformed beacons */ }
  return new Response(null, { status: 204 });
}
