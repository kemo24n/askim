import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "./auth";
import { getTableContext } from "./table";

export const ok = (data: unknown = { ok: true }, init?: ResponseInit) => NextResponse.json(data, init);
export const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function requireAdmin() {
  return (await isAdmin()) ? null : bad("Unauthorized", 401);
}

export async function requireGuest() {
  const ctx = await getTableContext();
  return ctx;
}
