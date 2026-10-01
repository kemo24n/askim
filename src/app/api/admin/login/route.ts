import { cookies } from "next/headers";
import { ADMIN_COOKIE, checkPassword, createAdminToken } from "@/lib/auth";
import { bad, ok } from "@/lib/api";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (!password || !checkPassword(password)) return bad("Wrong password", 401);
  (await cookies()).set(ADMIN_COOKIE, createAdminToken(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 14 * 86400, secure: process.env.NODE_ENV === "production" });
  return ok();
}
