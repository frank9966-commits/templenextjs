"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // ✅ 加入 useSession()
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function Home() {
  const [title, setTitle] = useState("");
  const { data: session } = useSession(); // ✅ 取得 session 狀態

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
    <div className="hero min-h-screen flex flex-col items-center justify-center">
      <div className="hero-overlay bg-white flex flex-col items-center justify-center w-full">
        <Image
          src="/test.png"
          alt="活動圖片"
          width={480}
          height={240}
          className="max-w-[240px] w-full h-auto rounded-lg"
        />
      </div>
      <div className="hero-content flex-col w-full max-w-2xl text-center text-black">
        <div className="card bg-base-100 w-full shadow-xl">
          <div className="card-body">
            <h1 className="text-3xl sm:text-4xl font-bold">
              {title || "活動標題"}
            </h1>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
              <a href="/register" className="btn btn-primary w-full sm:w-auto">
                報名參加
              </a>
              {/* ✅ 只有 `admin` 才能看到管理後台按鈕 */}
              {session?.user?.role === "admin" && (
                <a href="/admin" className="btn btn-secondary w-full sm:w-auto">
                  管理後台
                </a>
              )}

              {/* 如果未登入，則顯示登入按鈕 */}
              {!session && (
                <a href="/admin/signin" className="btn btn-secondary w-full sm:w-auto">
                  管理員登入
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
