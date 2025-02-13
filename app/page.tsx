"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [title, setTitle] = useState("");

  useEffect(() => {
    async function fetchTitle() {
      const { data, error } = await supabase
        .from("events")
        .select("title")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (error) {
        console.error("取得最新活動標題失敗：", error);
      } else if (data) {
        setTitle(data.title);
      }
    }
    fetchTitle();
  }, []);

  return (
    <div className="hero min-h-screen">
      <div className="hero-overlay bg-black bg-opacity-60"></div>
      <div className="hero-content flex-col w-full max-w-2xl text-center text-neutral-content">
        <div className="card bg-base-100 text-black w-full shadow-xl">
          <div className="card-body">
            <h1 className="text-3xl sm:text-4xl font-bold">
              {title || "活動標題"}
            </h1>
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
      </div>
    </div>
  );
}
