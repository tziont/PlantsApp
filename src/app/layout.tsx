import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import SiteFooter from "@/components/layout/SiteFooter";
import "@/styles/globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plant Watering Control",
  description: "Monitor plant moisture conditions from connected moisture meters",
};

export const viewport: Viewport = {
  // Matches --color-bg in each scheme so the mobile browser chrome blends in.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#1c211d" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <a href="#main" className="skipLink">
          Skip to content
        </a>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
