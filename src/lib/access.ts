/** Private-demo gate. Active only when DEMO_PASSWORD is set. Works in any runtime (Web Crypto). */
export const ACCESS_COOKIE = "askim_access";

export const gateEnabled = () => !!process.env.DEMO_PASSWORD;

export async function accessToken(): Promise<string> {
  const data = new TextEncoder().encode(`askim-access:${process.env.DEMO_PASSWORD}:${process.env.AUTH_SECRET || "askim-dev-secret"}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
