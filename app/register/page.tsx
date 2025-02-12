"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterStep() {
  const [hasParticipated, setHasParticipated] = useState<boolean | null>(null);
  const [idCard, setIdCard] = useState("");
  // 【修改】更新 basicInfo 型別，擴充地址、生日、關係人欄位
  const [basicInfo, setBasicInfo] = useState<{
    name: string;
    address?: string;
    birthday?: string;
    family_id?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [selectedParticipate, setSelectedParticipate] = useState<boolean | null>(null);

  // 【新增】獨立狀態，若使用者需手動輸入資料時，提供地址、生日、關係人的輸入值
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [familyId, setFamilyId] = useState("");

  // 【新增】目前活動資訊 (id 與 title)
  const [currentEvent, setCurrentEvent] = useState<{ id: number; title: string } | null>(null);

  // 【新增】掛載時取得目前活動資料
  useEffect(() => {
    async function fetchCurrentEvent() {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .eq("code", "current")
        .single();
      if (!error && data) {
        setCurrentEvent(data);
      }
    }
    fetchCurrentEvent();
  }, []);

  // 【修改】依身分證由 participants 撈取基本資料
  const handleCheckId = async () => {
    if (!idCard) return;
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", idCard)
      .single();
    if (error || !data) {
      setError("找不到基本資料，請手動輸入");
      setBasicInfo(null);
    } else {
      setBasicInfo({
        name: data.name,
        address: data.address,
        birthday: data.birthday,
        family_id: data.family_id,
      });
      // 同步自動填入手動輸入欄位（若使用者想修改）
      setAddress(data.address || "");
      setBirthday(data.birthday || "");
      setFamilyId(data.family_id || "");
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) {
      setError("目前活動資訊取得失敗");
      return;
    }
    // 組合報名資料，若 basicInfo 有值則使用其資料，否則採用手動輸入值
    const participantData = {
      id_card: idCard,
      name: basicInfo ? basicInfo.name : "請自行輸入姓名",
      address: address,
      birthday: birthday,
      event_id: currentEvent.id,
      is_participated: selectedParticipate,
      family_id: familyId,
    };

    const { error } = await supabase.from("participants").insert([participantData]);
    if (error) {
      setError("報名失敗：" + error.message);
    } else {
      alert("報名成功！");
      // 可考慮重置表單狀態
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold text-center mb-4">
        報名活動 {currentEvent ? `- ${currentEvent.title}` : ""}
      </h1>
      {hasParticipated === null ? (
        <div className="flex flex-col space-y-4 items-center">
          <p>您是否曾參加過此廟活動？</p>
          <div className="flex space-x-4">
            <button onClick={() => setHasParticipated(true)} className="btn btn-success">
              是
            </button>
            <button onClick={() => setHasParticipated(false)} className="btn btn-primary">
              否
            </button>
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
          <button onClick={handleCheckId} className="btn btn-secondary">
            查詢資料
          </button>
          {error && <p className="text-red-500">{error}</p>}
          {basicInfo && (
            <div className="mt-4 space-y-4">
              <p>基本資料：</p>
              <p>姓名：{basicInfo.name}</p>
              <p>地址：</p>
              <input
                type="text"
                placeholder="地址"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input input-bordered w-full"
              />
              <p>生日：</p>
              <input
                type="text"
                placeholder="生日"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="input input-bordered w-full"
              />
              <p>關係人 (家族代號)：</p>
              <input
                type="text"
                placeholder="關係人"
                value={familyId}
                onChange={(e) => setFamilyId(e.target.value)}
                className="input input-bordered w-full"
              />
              <div className="flex justify-between mt-4">
                <button onClick={() => setSelectedParticipate(true)} className="btn btn-success w-1/2">
                  參加
                </button>
                <button onClick={() => setSelectedParticipate(false)} className="btn btn-error w-1/2">
                  不參加
                </button>
              </div>
              <form onSubmit={handleSubmit} className="mt-4">
                <button type="submit" className="btn btn-primary w-full">
                  送出報名
                </button>
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
          <input
            type="text"
            placeholder="姓名"
            onChange={(e) =>
              setBasicInfo((prev) => ({ ...prev, name: e.target.value }))
            }
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="地址"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="生日"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="關係人 (家族代號)"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="input input-bordered w-full"
          />
          <div className="flex justify-between">
            <button type="button" onClick={() => setSelectedParticipate(true)} className="btn btn-success w-1/2">
              參加
            </button>
            <button type="button" onClick={() => setSelectedParticipate(false)} className="btn btn-error w-1/2">
              不參加
            </button>
          </div>
          <button type="submit" className="btn btn-primary w-full">
            送出報名
          </button>
          {error && <p className="text-red-500">{error}</p>}
        </form>
      )}
    </div>
  );
}
