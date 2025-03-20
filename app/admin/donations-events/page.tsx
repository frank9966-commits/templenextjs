"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AddEvent() {
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [message, setMessage] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    // 生成活動代碼（可自行更改生成邏輯）
    const codeValue = `event_${Date.now()}`;

    // 將 totalAmount 轉成數字，避免存成字串
    const parsedAmount = parseInt(totalAmount, 10);

    // 插入到 donations_events 資料表
    const { error } = await supabase
      .from("donations_events")
      .insert({
        title,             // 活動標題
        code: codeValue,   // 活動代碼
        total_amount: parsedAmount, // 金額
        allamount: totalAmount, // 金額
      });

    if (error) {
      setMessage("新增失敗：" + error.message);
    } else {
      setMessage("新增成功！");
      setTitle("");
      setTotalAmount("");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold text-center mb-4">新增捐款活動</h1>
        <form onSubmit={handleAdd} className="max-w-md mx-auto space-y-4">
          {/* 活動標題 */}
          <input
            type="text"
            placeholder="捐款活動標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered w-full"
          />
          {/* 金額 */}
          <input
            type="number"
            placeholder="捐款金額"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="input input-bordered w-full"
          />
          {/* 送出按鈕 */}
          <button type="submit" className="btn btn-primary w-full">
            新增捐款活動
          </button>
        </form>
        {message && <p className="text-center mt-2">{message}</p>}
      </div>
    </div>
  );
}
