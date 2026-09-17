import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/lib/env/server";

import "./globals.css";

export const metadata: Metadata = {
  title: "KGJ Marketing Funnel Hub",
  description:
    "Fondasi aplikasi marketing funnel dan tracking KotaGede Jewellery.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
