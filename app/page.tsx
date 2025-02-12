"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [title, setTitle] = useState("");

  useEffect(() => {
    async function fetchTitle() {
      const { data } = await supabase.from("events").select("title").eq("code", "current").single();
      if (data) setTitle(data.title);
    }
    fetchTitle();
  }, []);

  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold">{title || "活動標題"}</h1>
      <div className="mt-4 space-y-4">
        <a href="/register" className="btn btn-primary block w-full sm:w-auto">
          報名參加
        </a>
        <a href="/admin/signin" className="btn btn-secondary block w-full sm:w-auto">
          管理後台
        </a>
      </div>
    </div>
  );
}
