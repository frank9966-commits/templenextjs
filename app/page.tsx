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
    // hero + 自訂背景或圖
    <div
      className="hero min-h-screen"
      // style={{
      //   backgroundImage: "url('/images/bg-image.jpg')", // 若不想要背景圖可移除
      // }}
    >
      {/* hero-overlay 讓背景更暗一些、文字更清楚 */}
      <div className="hero-overlay bg-black bg-opacity-60"></div>

      {/* hero-content：中央的內容區 */}
      <div className="hero-content flex-col w-full max-w-2xl text-center text-neutral-content">
        {/* 這裡可以再加一個 card 使文字與按鈕有卡片的外框 */}
        <div className="card bg-base-100 text-black w-full shadow-xl">
          <div className="card-body">
            {/* 標題 */}
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
