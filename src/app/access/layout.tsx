import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "Aşkım · Private preview", robots: { index: false, follow: false }, icons: { icon: "/favicon.svg" } };
export const viewport: Viewport = { themeColor: "#0b0908", width: "device-width", initialScale: 1 };

export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="grain min-h-dvh">{children}</body>
    </html>
  );
}
