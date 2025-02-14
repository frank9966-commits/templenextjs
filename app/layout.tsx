"use client"; // ✅ 確保這是 Client Component

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HomeButton from "@/components/HomeButton";
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}
      >
        <SessionProvider> {/* ✅ 確保 SessionProvider 在 client component 內 */}
          <header className="w-full p-4 bg-base-200 flex justify-center">
            <HomeButton />
          </header>

          <main className="flex-1 flex items-center justify-center w-full">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
