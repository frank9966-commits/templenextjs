"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddEvent() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // 例如這裡給每筆活動一個 code，可以是時間戳或其他生成方式
    const codeValue = `event_${Date.now()}`;

    const { error } = await supabase.from("events").insert({
      title,
      code: codeValue,
    });

    if (error) {
      setMessage("新增失敗：" + error.message);
    } else {
      setMessage("新增成功！");
      setTitle("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold text-center mb-4">新增活動標題</h1>
        <form onSubmit={handleAdd} className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            placeholder="活動標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full"
          />
          <button type="submit" className="btn btn-primary w-full">
            新增標題
          </button>
        </form>
        {message && <p className="text-center mt-2">{message}</p>}
      </div>
    </div>
  );
}
