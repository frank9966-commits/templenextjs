"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterStep() {
  const [hasParticipated, setHasParticipated] = useState<boolean | null>(null);
  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{
    name: string;
    address?: string;
    birthday?: string;
    family_id?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [selectedParticipate, setSelectedParticipate] = useState<boolean | null>(null);

  // 若使用者需手動輸入資料時提供的輸入值
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [familyId, setFamilyId] = useState("");

  // 目前活動資訊 (id 與 title)
  const [currentEvent, setCurrentEvent] = useState<{ id: number; title: string } | null>(null);

  // 掛載時取得目前活動資料
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

  // 依身分證由 participants 撈取基本資料
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
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">
            報名活動 {currentEvent ? `- ${currentEvent.title}` : ""}
          </h1>
        </div>

        {hasParticipated === null && (
          <div className="card w-full max-w-md shadow-xl bg-base-100">
            <div className="card-body">
              <p className="text-center text-lg mb-4">您是否曾參加過此廟活動？</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setHasParticipated(true)} className="btn btn-success">
                  是
                </button>
                <button onClick={() => setHasParticipated(false)} className="btn btn-primary">
                  否
                </button>
              </div>
            </div>
          </div>
        )}

        {hasParticipated === true && (
          <div className="card w-full max-w-md shadow-xl bg-base-100">
            <div className="card-body">
              <p className="text-center text-lg mb-4">請輸入您的身分證以查詢基本資料：</p>
              <div className="form-control mb-4">
                <input
                  type="text"
                  placeholder="身分證"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              <button onClick={handleCheckId} className="btn btn-secondary w-full mb-4">
                查詢資料
              </button>
              {error && <p className="text-red-500 text-center mb-4">{error}</p>}

              {basicInfo && (
                <div className="card mt-6 shadow-lg bg-base-50">
                  <div className="card-body">
                    <h2 className="card-title mb-4">基本資料</h2>
                    <p className="mb-2">
                      <span className="font-semibold">姓名：</span>
                      {basicInfo.name}
                    </p>
                    <div className="form-control mb-2">
                      <label className="label">
                        <span className="label-text">地址：</span>
                      </label>
                      <input
                        type="text"
                        placeholder="地址"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div className="form-control mb-2">
                      <label className="label">
                        <span className="label-text">生日：</span>
                      </label>
                      <input
                        type="text"
                        placeholder="生日"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text">關係人 (家族代號)：</span>
                      </label>
                      <input
                        type="text"
                        placeholder="關係人"
                        value={familyId}
                        onChange={(e) => setFamilyId(e.target.value)}
                        className="input input-bordered w-full"
                      />
                    </div>
                    <div className="flex justify-between">
                      <button
                        onClick={() => setSelectedParticipate(true)}
                        className="btn btn-success w-1/2 mr-2"
                      >
                        參加
                      </button>
                      <button
                        onClick={() => setSelectedParticipate(false)}
                        className="btn btn-error w-1/2 ml-2"
                      >
                        不參加
                      </button>
                    </div>
                    <button onClick={handleSubmit} className="btn btn-primary w-full mt-4">
                      送出報名
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {hasParticipated === false && (
          <form onSubmit={handleSubmit} className="card w-full max-w-md shadow-xl bg-base-100">
            <div className="card-body space-y-4">
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
                <button
                  type="button"
                  onClick={() => setSelectedParticipate(true)}
                  className="btn btn-success w-1/2 mr-2"
                >
                  參加
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedParticipate(false)}
                  className="btn btn-error w-1/2 ml-2"
                >
                  不參加
                </button>
              </div>
              <button type="submit" className="btn btn-primary w-full">
                送出報名
              </button>
              {error && <p className="text-red-500 text-center">{error}</p>}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
