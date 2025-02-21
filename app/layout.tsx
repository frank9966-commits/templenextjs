"use client";

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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="h-full">
      {/* 讓 html 填滿畫面高度 */}
      <body
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          antialiased 
          flex 
          flex-col 
          h-full 
          overflow-hidden  /* <-- 關鍵：不需要滾動條 */
        `}
      >
        <SessionProvider>
          <header className="w-full p-4 flex justify-center">
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
