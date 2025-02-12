"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Participant {
  id: number;
  id_card: string;
  name: string;
  is_participated: boolean;
  address?: string;
  birthday?: string;
  created_at: string;
  updated_at: string;
  family_id?: string;
  events: { title: string } | null;
}

export default function AdminDashboard() {
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sticky top-0 bg-base-200 p-4 z-10">
        報名狀況
      </h1>
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* RWD 優化 + 滾動 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[calc(100vh-150px)] p-2">
        {participants.map((p) => (
          <div key={p.id} className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title text-lg font-bold">{p.name}</h2>
              <p><strong>身分證:</strong> {p.id_card}</p>
              <p><strong>地址:</strong> {p.address || "-"}</p>
              <p><strong>生日:</strong> {p.birthday || "-"}</p>
              <p><strong>創造日期:</strong> {new Date(p.created_at).toLocaleString()}</p>
              <p><strong>參加活動名稱:</strong> {p.events ? p.events.title : "-"}</p>
              <p>
                <strong>是否參加:</strong>{" "}
                <span className={p.is_participated ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                  {p.is_participated ? "參加" : "不參加"}
                </span>
              </p>
              <p><strong>最後編輯時間:</strong> {new Date(p.updated_at).toLocaleString()}</p>
              <p><strong>關係人:</strong> {p.family_id || "-"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
