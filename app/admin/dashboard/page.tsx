"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Participant {
  id: number;
  id_card: string;
  name: string;
  participation_status?: string;
  address?: string;
  birthday?: string;
  created_at: string;
  updated_at: string;
  family_id?: string;
  admin_viewed: boolean;
  zodiac_sign?: string;
  events: { title: string } | null;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "admin") {
      router.push("/signin"); // 如果不是管理員，導向登入頁
    }
  }, [session, status, router]);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchParticipants() {
      const { data, error } = await supabase
        .from("participants")
        .select("*, events(title)");
      if (error) {
        setError("取得資料失敗：" + error.message);
      } else {
        setParticipants(data as Participant[]);
      }
    }
    fetchParticipants();
  }, []);

  // 標記使用者為已查看
  const markAsViewed = async (id: number) => {
    const { error } = await supabase
      .from("participants")
      .update({ admin_viewed: true })
      .eq("id", id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, admin_viewed: true } : p
        )
      );
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sticky top-0 bg-base-200 p-4 z-10">
        報名狀況
      </h1>
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* RWD 優化 + 滾動 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-150px)] p-2">
        {participants.map((p) => {
          const isEdited = new Date(p.created_at).getTime() !== new Date(p.updated_at).getTime();
          const hasChanges = isEdited || (p.participation_status && p.participation_status !== "none");

          const highlight = (!p.admin_viewed && hasChanges) ? "border-4 border-yellow-500" : "";

          return (
            <div key={p.id} className={`card bg-base-100 shadow-lg ${highlight}`}>
              <div className="card-body">
                <h2 className="card-title text-lg font-bold">{p.name}</h2>
                <p><strong>身分證:</strong> {p.id_card}</p>
                <p><strong>地址:</strong> {p.address || "-"}</p>
                <p><strong>生辰:</strong> {p.birthday || "-"}</p>
                <p><strong>生肖:</strong> {p.zodiac_sign || "-"}</p>
                <p><strong>參加活動名稱:</strong> {p.events ? p.events.title : "-"}</p>
                <p>
                  <strong>是否參加:</strong>{" "}
                  {p.participation_status === "join" ? (
                    <span className="text-green-600 font-semibold">參加</span>
                  ) : (
                    <span className="text-red-600 font-semibold">不參加</span>
                  )}
                </p>
                <p><strong>關係人:</strong> {p.family_id || "-"}</p>
                <p><strong>創造日期:</strong> {new Date(p.created_at).toLocaleString()}</p>
                <p><strong>最後編輯時間:</strong> {new Date(p.updated_at).toLocaleString()}</p>

                {!p.admin_viewed && hasChanges && (
                  <button
                    onClick={() => markAsViewed(p.id)}
                    className="btn btn-warning mt-2 w-full"
                  >
                    標記為已查看
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
