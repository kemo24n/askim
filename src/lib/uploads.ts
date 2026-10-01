import { join } from "node:path";
export const uploadDir = () => process.env.UPLOAD_DIR || join(process.cwd(), "uploads");
