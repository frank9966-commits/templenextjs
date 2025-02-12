"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [title, setTitle] = useState("");

  useEffect(() => {
    async function fetchTitle() {
      const { data } = await supabase
        .from("events")
        .select("title")
        .eq("code", "current")
        .single();
      if (data) setTitle(data.title);
    }
    fetchTitle();
  }, []);

  return (
    <div className="hero min-h-screen bg-base-200 flex items-center justify-center">
      <div className="hero-content w-full max-w-2xl text-center">
        <h1 className="text-4xl sm:text-5xl font-bold">{title || "活動標題"}</h1>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
          <a href="/register" className="btn btn-primary w-full sm:w-auto">
            報名參加
          </a>
          <a href="/admin/signin" className="btn btn-secondary w-full sm:w-auto">
            管理後台
          </a>
        </div>
      </div>
    </div>
  );
}
