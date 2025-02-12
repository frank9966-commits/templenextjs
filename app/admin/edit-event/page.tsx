// /app/admin/edit-event.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EditEvent() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchEvent() {
      const { data, error } = await supabase
        .from("events")
        .select("title")
        .eq("code", "current")
        .single();
      if (error) {
        setMessage("取得活動資料失敗：" + error.message);
      } else if (data) {
        setTitle(data.title);
      }
    }
    fetchEvent();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("events")
      .update({ title })
      .eq("code", "current");
    if (error) {
      setMessage("更新失敗：" + error.message);
    } else {
      setMessage("更新成功！");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold text-center mb-4">編輯活動標題</h1>
      <form onSubmit={handleUpdate} className="max-w-md mx-auto space-y-4">
        <input
          type="text"
          placeholder="活動標題"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input input-bordered w-full"
        />
        <button type="submit" className="btn btn-primary w-full">更新標題</button>
      </form>
      {message && <p className="text-center mt-2">{message}</p>}
    </div>
  );
}
