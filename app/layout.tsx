import type { Metadata } from "next";
import { Inter, Space_Grotesk, Noto_Sans_Arabic } from "next/font/google";

import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { AppShell } from "./shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-ar" });

export const metadata: Metadata = {
  title: "Beam AI — Proposal Generator",
  description: "AI-powered technical proposal generator from RFPs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${notoArabic.variable} antialiased`}>
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
