import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "Aşkım · Control Room", robots: { index: false }, icons: { icon: "/favicon.svg" } };
export const viewport: Viewport = { themeColor: "#0b0908" };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="admin min-h-dvh bg-ink text-champagne">{children}</body>
    </html>
  );
}
