// components/HomeButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function HomeButton() {
  const router = useRouter();

  return (
    <button onClick={() => router.push("/")} className="btn btn-primary">
      回首頁
    </button>
  );
}
