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
      <table className="table w-full">
        <thead>
          <tr>
            <th>身分證</th>
            <th>姓名</th>
            <th>地址</th>
            <th>生日</th>
            <th>創造日期</th>
            <th>參加活動名稱</th>
            <th>是否參加</th>
            <th>最後編輯時間</th>
            <th>關係人</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td>{p.id_card}</td>
              <td>{p.name}</td>
              <td>{p.address || "-"}</td>
              <td>{p.birthday || "-"}</td>
              <td>{new Date(p.created_at).toLocaleString()}</td>
              <td>{p.events ? p.events.title : "-"}</td>
              <td>{p.is_participated ? "參加" : "不參加"}</td>
              <td>{new Date(p.updated_at).toLocaleString()}</td>
              <td>{p.family_id || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
