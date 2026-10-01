import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { dirOf, isLang } from "@/lib/i18n";
import { Toaster } from "@/components/ui/Toaster";
import "../../globals.css";

export const metadata: Metadata = {
  title: "Aşkım · أشكم — Levantine kitchen, Turkish soul",
  description: "The interactive menu of Aşkım, Damascus. Explore, share a live table, and send a dessert with love.",
  icons: { icon: "/favicon.svg" },
};
export const viewport: Viewport = { themeColor: "#0b0908", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function GuestLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} dir={dirOf(lang)}>
      <body className="grain min-h-dvh">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
