import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bricolage_Grotesque, Manrope } from "next/font/google";

import "@/lib/env/server";

import "./globals.css";

const bodyFont = Manrope({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
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
    <html lang="id" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
