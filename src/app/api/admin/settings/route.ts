import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema as s } from "@/db";
import { bad, ok, requireAdmin } from "@/lib/api";
import { getSettings } from "@/lib/menu";

const Body = z.object({
  nameAr: z.string().max(60), nameEn: z.string().max(60), nameTr: z.string().max(60),
  taglineAr: z.string().max(120), taglineEn: z.string().max(120), taglineTr: z.string().max(120),
  phone: z.string().max(40).nullable(), whatsapp: z.string().max(40).nullable(),
  instagram: z.string().max(200).nullable(), facebook: z.string().max(200).nullable(),
  googleReviews: z.string().max(300).nullable(), address: z.string().max(200).nullable(),
  logoUrl: z.string().max(500).nullable(), coverUrl: z.string().max(500).nullable(),
  rateUSD: z.number().positive(), rateEUR: z.number().positive(), rateTRY: z.number().positive(), rateAED: z.number().positive(),
  showOldSYP: z.boolean(), serviceFeePct: z.number().min(0).max(50),
  giftsEnabled: z.boolean(), ordersEnabled: z.boolean(),
}).partial();

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return ok(await getSettings());
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return bad(p.error.issues[0]?.message ?? "Invalid settings");
  await getSettings();
  const [row] = await db.update(s.settings).set({ ...p.data, updatedAt: new Date() }).where(eq(s.settings.id, 1)).returning();
  return ok(row);
}
