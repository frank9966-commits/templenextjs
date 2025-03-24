"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react"; // ✅ 加入 useSession()
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

export default function Home() {
  // const [title, setTitle] = useState("");
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
        // setTitle(data.title);
      }
    }
    fetchTitle();
  }, []);

  return (
    <div className="hero min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="flex flex-col items-center justify-center w-full">
        <Image
          src="/test.png"
          alt="活動圖片"
          width={300}
          height={300}
          className="max-w-[300px] h-auto"
        />
      </div>
      <div className="hero-content flex-col w-full max-w-2xl text-center text-black">
        <div className="card bg-base-100 w-full shadow-xl">
          <div className="card-body">
            <div className="flex flex-col gap-4 sm:flex-row justify-center text-lg font-bold">
              <a
                href="/register"
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-white bg-[#E6A23C] hover:opacity-90"
              >
                活動報名
              </a>
              <a
                href="/donations"
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-white bg-[#409EFF] hover:opacity-90"
              >
                募款
              </a>
              {session?.user?.role === "admin" && (
                <a
                  href="/admin"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg text-white bg-[#67CFCF] hover:opacity-90"
                >
                  管理後台
                </a>
              )}
              {!session && (
                <a
                  href="/admin/signin"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg text-white bg-[#67CFCF] hover:opacity-90"
                >
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
