import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/app/providers";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import RouteProgress from "@/components/RouteProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "大学生自救指南",
  description: "高质量学习资料分享与检索平台",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <RouteProgress />
          <Navbar />
          <PageTransition>{children}</PageTransition>
        </Providers>
      </body>
    </html>
  );
}
