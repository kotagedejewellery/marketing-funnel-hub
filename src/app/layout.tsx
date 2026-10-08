import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Bricolage_Grotesque, Inter, Manrope } from "next/font/google";

import "@/lib/env/server";

import { RouteProgress } from "@/components/route-progress";

import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const linkBioFont = Inter({
  subsets: ["latin"],
  variable: "--font-link-bio",
});

export const metadata: Metadata = {
  title: "Kotagede Jewellery | Link Bio Cabang",
  description:
    "Pilih cabang Kotagede Jewellery, jelajahi produk, dan hubungi WhatsApp cabang terkait.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${bodyFont.variable} ${displayFont.variable} ${linkBioFont.variable}`}
    >
      <body>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
