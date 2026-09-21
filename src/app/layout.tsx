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
  title: "Kotagede Jewellery | Pilihan Produk",
  description: "Jelajahi pilihan produk dan hubungi cabang Kotagede Jewellery.",
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
