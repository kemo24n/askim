import { asc } from "drizzle-orm";
import QRCode from "qrcode";
import { headers } from "next/headers";
import { db, schema as s } from "@/db";
import { TablesQR } from "@/components/admin/TablesQR";

export const dynamic = "force-dynamic";

export default async function Page() {
  const tables = await db.select().from(s.tables).orderBy(asc(s.tables.number));
  const h = await headers();
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const withQr = await Promise.all(
    tables.map(async (t) => {
      const url = `${base.replace(/\/$/, "")}/t/${t.token}`;
      const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1a120c", light: "#00000000" } });
      return { ...t, url, svg };
    }),
  );
  return <TablesQR tables={withQr} />;
}
