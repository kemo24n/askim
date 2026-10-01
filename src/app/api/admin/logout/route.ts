import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function POST() {
  (await cookies()).delete(ADMIN_COOKIE);
  return ok();
}
