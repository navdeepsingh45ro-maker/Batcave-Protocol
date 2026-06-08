import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BATCAVE // Command System",
  description:
    "Wayne Enterprises private discipline and mission execution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
