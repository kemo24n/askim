import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { bad, ok, requireAdmin } from "@/lib/api";

import { uploadDir as UPLOAD_DIR } from "@/lib/uploads";
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };

/** Owner uploads a dish photo from the dashboard → stored on our own server. */
export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return bad("No file");
  const ext = TYPES[file.type];
  if (!ext) return bad("Use a JPG, PNG, WebP or AVIF image");
  if (file.size > 8 * 1024 * 1024) return bad("Max 8 MB");
  const name = `${randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR(), { recursive: true });
  await writeFile(join(UPLOAD_DIR(), name), Buffer.from(await file.arrayBuffer()));
  return ok({ path: `/uploads/${name}` });
}
