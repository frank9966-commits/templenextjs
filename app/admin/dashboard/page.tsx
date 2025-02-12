// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Participant {
  id: number;
  id_card: string;
  name: string;
  participated: boolean;
}

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchParticipants() {
      const { data, error } = await supabase.from("participants").select("*");
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
            <th>是否參加</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td>{p.id_card}</td>
              <td>{p.name}</td>
              <td>{p.participated ? "參加" : "不參加"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
