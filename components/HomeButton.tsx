// components/HomeButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function HomeButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="px-6 py-3 rounded-lg text-white bg-[#38B48B] hover:opacity-90 text-lg font-bold"
    >
      回首頁
    </button>
  );
}
