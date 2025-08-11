import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import NavbarWrapper from "@/components/NavbarWrapper";
import PageTransitionEnhanced from "@/components/PageTransitionEnhanced";
import RouteProgress from "@/components/RouteProgress";
import { getBasicSettings } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export async function generateMetadata(): Promise<Metadata> {
  const settings = await getBasicSettings();
  
  return {
    title: settings.siteName,
    description: settings.siteDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <RouteProgress />
          <NavbarWrapper />
          <PageTransitionEnhanced>{children}</PageTransitionEnhanced>
        </Providers>
      </body>
    </html>
  );
}
