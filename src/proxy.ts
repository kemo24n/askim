import { NextResponse, type NextRequest } from "next/server";

/** Language routing: `/` → `/ar`, `/t/<token>` → `/ar/t/<token>`, `/demo` → `/ar/demo` */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
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

export const config = { matcher: ["/", "/t/:path*", "/demo"] };
