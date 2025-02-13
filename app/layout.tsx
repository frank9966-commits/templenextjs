// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import HomeButton from "@/components/HomeButton"; // 引入回首頁按鈕

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "無極天王宮",
  description: "無極天王宮",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col h-screen`}
      >
        <header className="w-full p-4 bg-base-200 flex justify-center">
          <HomeButton />
        </header>

        <main className="flex-1 flex items-center justify-center w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
