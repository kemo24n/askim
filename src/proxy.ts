import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, accessToken, gateEnabled } from "@/lib/access";

const OPEN = [/^\/access$/, /^\/api\/access$/, /^\/_next\//, /^\/favicon/];

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) Private demo gate — everything (guest menu, admin, APIs, photos) needs the demo password
  if (gateEnabled() && !OPEN.some((r) => r.test(pathname))) {
    if (req.cookies.get(ACCESS_COOKIE)?.value !== (await accessToken())) {
      if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Locked" }, { status: 401 });
      const url = new URL("/access", req.url);
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  // 2) Language routing: `/` → `/ar`, `/t/<token>` → `/ar/t/<token>`, `/demo` → `/ar/demo`
  const saved = req.cookies.get("askim_lang")?.value;
  const accept = (req.headers.get("accept-language") ?? "").toLowerCase();
  const preferred = saved === "ar" || saved === "tr" || saved === "en" ? saved
    : accept.startsWith("tr") ? "tr" : accept.startsWith("en") ? "en" : "ar";
  if (pathname === "/") return NextResponse.redirect(new URL(`/${preferred}`, req.url));
  if (pathname.startsWith("/t/") || pathname === "/demo") {
    return NextResponse.redirect(new URL(`/${preferred}${pathname}`, req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"] };
