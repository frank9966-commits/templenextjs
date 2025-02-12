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
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col">
        <h1 className="text-5xl font-bold text-center">{title || "活動標題"}</h1>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <a href="/register" className="btn btn-primary">
            報名參加
          </a>
          <a href="/admin/signin" className="btn btn-secondary">
            管理後台
          </a>
        </div>
      </div>
    </div>
  );
}
