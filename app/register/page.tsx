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

  // 依身分證由 participants 撈取基本資料 (使用者按「查詢資料」時)
  const handleCheckId = async () => {
    if (!idCard) return;
    setError(""); // 清空錯誤訊息
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
      setError(""); // 清空錯誤訊息
    }
  };

  // 按「送出報名」時
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // 先清空錯誤訊息

    if (!currentEvent) {
      setError("目前活動資訊取得失敗");
      return;
    }

    // 準備報名資料
    const participantData = {
      id_card: idCard,
      name: basicInfo ? basicInfo.name : "請自行輸入姓名",
      address: address,
      birthday: birthday,
      event_id: currentEvent.id,
      is_participated: selectedParticipate,
      family_id: familyId,
    };

    // **新增**：先查詢資料表，看是否已經有這個 id_card
    const { data: existed, error: fetchError } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", idCard)
      .single();

    // 如果查不到 (fetchError) 或沒有資料 => Insert
    if (fetchError || !existed) {
      const { error: insertError } = await supabase
        .from("participants")
        .insert([participantData]);

      if (insertError) {
        setError("報名失敗：" + insertError.message);
      } else {
        alert("報名成功！");
      }
    } else {
      // **已經存在** => Update
      // 例如只更新 address、birthday、is_participated 等欄位
      const { error: updateError } = await supabase
        .from("participants")
        .update({
          // 你想更新哪些欄位就放哪些
          name: participantData.name,
          address: participantData.address,
          birthday: participantData.birthday,
          is_participated: participantData.is_participated,
          family_id: participantData.family_id,
        })
        .eq("id_card", idCard);

      if (updateError) {
        setError("更新失敗：" + updateError.message);
      } else {
        // **顯示「已報名過」，並更新狀態**的提示
        setError("您已註冊過，此次已幫您更新資料或狀態。");
      }
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200 p-4 flex items-center justify-center">
      <div className="hero-content flex-col w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center">
            報名活動 {currentEvent ? `- ${currentEvent.title}` : ""}
          </h1>
        </div>

        {/* 是否曾參加 (是 / 否) */}
        {hasParticipated === null && (
          <div className="card w-full sm:max-w-sm md:max-w-md lg:max-w-lg shadow-xl bg-base-100 mx-auto">
            <div className="card-body">
              <p className="text-center text-lg mb-4">您是否曾註冊過此帳號？</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setHasParticipated(true)}
                  className="btn btn-success hover:bg-green-700"
                >
                  是
                </button>
                <button
                  onClick={() => setHasParticipated(false)}
                  className="btn btn-error hover:bg-red-700"
                >
                  否
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 若選「是」 */}
        {hasParticipated === true && (
          <div className="card w-full sm:max-w-sm md:max-w-md lg:max-w-lg shadow-xl bg-base-100 mx-auto">
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

                    {/* 參加 / 不參加，根據 selectedParticipate 動態改樣式 */}
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedParticipate(true)}
                        className={`btn w-1/2 mr-2 ${selectedParticipate === true
                            ? "btn-success hover:bg-green-700"
                            : "btn-outline hover:bg-green-700"
                          }`}
                      >
                        參加
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedParticipate(false)}
                        className={`btn w-1/2 ml-2 ${selectedParticipate === false
                            ? "btn-error hover:bg-red-700"
                            : "btn-outline hover:bg-red-700"
                          }`}
                      >
                        不參加
                      </button>
                    </div>

                    <button onClick={handleSubmit} className="btn btn-primary w-full mt-4">
                      送出報名
                    </button>
                    {/* 顯示錯誤或提示訊息 */}
                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 若選「否」 */}
        {hasParticipated === false && (
          <form
            onSubmit={handleSubmit}
            className="card w-full sm:max-w-sm md:max-w-md lg:max-w-lg shadow-xl bg-base-100 mx-auto"
          >
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
                  className={`btn w-1/2 mr-2 ${selectedParticipate === true
                      ? "btn-success hover:bg-green-700"
                      : "btn-outline hover:bg-green-700"
                    }`}
                >
                  參加
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedParticipate(false)}
                  className={`btn w-1/2 ml-2 ${selectedParticipate === false
                      ? "btn-error hover:bg-red-700"
                      : "btn-outline hover:bg-red-700"
                    }`}
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
