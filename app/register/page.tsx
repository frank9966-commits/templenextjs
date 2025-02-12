// /app/register/step.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterStep() {
  const [hasParticipated, setHasParticipated] = useState<boolean | null>(null);
  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{ name: string } | null>(null);
  const [error, setError] = useState("");
  const [selectedParticipate, setSelectedParticipate] = useState<boolean | null>(null);

  // 依身分證查詢基本資料
  const handleCheckId = async () => {
    if (!idCard) return;
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id_card", idCard)
      .single();
    if (error || !data) {
      setError("找不到基本資料，請手動輸入");
      setBasicInfo(null);
    } else {
      setBasicInfo({ name: data.name });
      setError("");
    }
  };

  // 提交報名資料
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 如果有查詢到基本資料，就沿用該資料；否則可考慮從其他表單取得使用者輸入
    const participantData = {
      id_card: idCard,
      name: basicInfo ? basicInfo.name : "請自行輸入姓名", // 若需要額外輸入姓名，可再補上對應欄位
      participated: selectedParticipate,
      event_code: "current", // 固定目前活動代號
    };

    const { error } = await supabase.from("participants").insert([participantData]);
    if (error) {
      setError("報名失敗：" + error.message);
    } else {
      alert("報名成功！");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold text-center mb-4">報名活動</h1>
      {hasParticipated === null ? (
        <div className="flex flex-col space-y-4 items-center">
          <p>您是否曾參加過此廟活動？</p>
          <div className="flex space-x-4">
            <button onClick={() => setHasParticipated(true)} className="btn btn-success">是</button>
            <button onClick={() => setHasParticipated(false)} className="btn btn-primary">否</button>
          </div>
        </div>
      ) : hasParticipated ? (
        // 曾參加過，透過身分證查詢基本資料後再報名
        <div className="space-y-4">
          <p>請輸入您的身分證以查詢基本資料：</p>
          <input
            type="text"
            placeholder="身分證"
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            className="input input-bordered w-full"
          />
          <button onClick={handleCheckId} className="btn btn-secondary">查詢資料</button>
          {error && <p className="text-red-500">{error}</p>}
          {basicInfo && (
            <div className="mt-4">
              <p>基本資料：</p>
              <p>姓名：{basicInfo.name}</p>
              {/* 可依需求顯示更多資料，或提供修改功能 */}
              <div className="flex justify-between mt-4">
                <button onClick={() => setSelectedParticipate(true)} className="btn btn-success w-1/2">參加</button>
                <button onClick={() => setSelectedParticipate(false)} className="btn btn-error w-1/2">不參加</button>
              </div>
              <form onSubmit={handleSubmit} className="mt-4">
                <button type="submit" className="btn btn-primary w-full">送出報名</button>
              </form>
            </div>
          )}
        </div>
      ) : (
        // 從未參加過，使用者自行輸入基本資料
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            placeholder="身分證"
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            className="input input-bordered w-full"
          />
          {/* 若有需要可以新增姓名輸入欄 */}
          <input
            type="text"
            placeholder="姓名"
            onChange={(e) => setBasicInfo({ name: e.target.value })}
            className="input input-bordered w-full"
          />
          <div className="flex justify-between">
            <button type="button" onClick={() => setSelectedParticipate(true)} className="btn btn-success w-1/2">參加</button>
            <button type="button" onClick={() => setSelectedParticipate(false)} className="btn btn-error w-1/2">不參加</button>
          </div>
          <button type="submit" className="btn btn-primary w-full">送出報名</button>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      )}
    </div>
  );
}
