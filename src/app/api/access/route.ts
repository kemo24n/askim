import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { ACCESS_COOKIE, accessToken } from "@/lib/access";
import { bad, ok } from "@/lib/api";

export async function POST(req: Request) {
  const expected = process.env.DEMO_PASSWORD;
  if (!expected) return ok();
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const a = Buffer.from(password ?? ""), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return bad("Wrong password", 401);
  }
  (await cookies()).set(ACCESS_COOKIE, await accessToken(), {
    httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production",
  });
  return ok();
}
