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
        .select("*, events(title)"); // 【新增】加入 events 的 title 資料
      if (error) {
        setError("取得資料失敗：" + error.message);
      } else {
        setParticipants(data as Participant[]);
      }
    }
    fetchParticipants();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold text-center mb-4">報名狀況</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}
      
      {/* 新增：卡片式排版，符合手機優先 */}
      <div className="flex flex-col gap-4">
        {participants.map((p) => (
          <div key={p.id} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">{p.name}</h2>
              <p>
                <strong>身分證:</strong> {p.id_card}
              </p>
              <p>
                <strong>地址:</strong> {p.address || "-"}
              </p>
              <p>
                <strong>生日:</strong> {p.birthday || "-"}
              </p>
              <p>
                <strong>創造日期:</strong>{" "}
                {new Date(p.created_at).toLocaleString()}
              </p>
              <p>
                <strong>參加活動名稱:</strong>{" "}
                {p.events ? p.events.title : "-"}
              </p>
              <p>
                <strong>是否參加:</strong>{" "}
                {p.is_participated ? "參加" : "不參加"}
              </p>
              <p>
                <strong>最後編輯時間:</strong>{" "}
                {new Date(p.updated_at).toLocaleString()}
              </p>
              <p>
                <strong>關係人:</strong> {p.family_id || "-"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
