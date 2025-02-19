// ParticipantQuery.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ParticipantQueryProps {
  currentEvent: { id: number; title: string };
}

export interface Participant {
  id_card: string;
  name: string;
  address?: string;
  birthday?: string;
  family_id?: string;
  event_date?: string;
  event_id?: number;
  participation_status?: "join" | "none" | "agent";
  zodiac_sign?: string;
  memo?: string;
}

const ParticipantQuery: React.FC<ParticipantQueryProps> = ({ currentEvent: _currentEvent }) => {
  // 使用 no-op 參考以抑制 ESLint 警告
  void _currentEvent;

  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{
    name: string;
    address?: string;
    birthday?: string;
    family_id?: string;
    participation_status?: "join" | "none" | "agent";
    event_id?: number,
    event_date?: string,
    zodiac_sign?: string;
    memo?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [familyMembers, setFamilyMembers] = useState<Participant[]>([]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000); // 5000 毫秒 = 5 秒
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 身分證驗證格式
  // 驗證台灣身分證字號格式（1 個大寫英文字母 + 9 個數字）
  const validateTaiwanIDFormat = (id: string): boolean => {
    const pattern = /^[A-Z][0-9]{9}$/;
    return pattern.test(id);
  };

  // 查詢身分證資料
  const handleCheckId = async () => {
    if (!idCard) return;
    setError("");

    // 將輸入轉換為大寫，避免因使用者輸入小寫導致驗證失敗
    const normalizedId = idCard.toUpperCase();

    // 使用 normalizedId 進行驗證
    if (!validateTaiwanIDFormat(normalizedId)) {
      setError("身分證格式不正確，請輸入正確格式（例如 A123456789）");
      return;
    }

    // 以 normalizedId 查詢資料庫
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", normalizedId)
      .single();

    if (error || !data) {
      setError("找不到基本資料，請手動輸入");
      setBasicInfo(null);
      setFamilyMembers([]);
    } else {
      setBasicInfo({
        name: data.name,
        address: data.address,
        birthday: data.birthday,
        family_id: data.family_id,
        event_date: data.event_date,
        participation_status: data.participation_status,
        zodiac_sign: data.zodiac_sign,
        memo: data.memo,
      });
      setError("");

      if (data.family_id) {
        const { data: familyData, error: familyError } = await supabase
          .from("participants")
          .select("*")
          .eq("family_id", data.family_id);
        if (familyError) {
          setError("無法取得代表人身分證字號資料：" + familyError.message);
          setFamilyMembers([]);
        } else {
          setFamilyMembers(familyData);
        }
      } else {
        setFamilyMembers([]);
      }
    }
  };

  // 編輯家族成員資料
  const handleFamilyMemberChange = (
    index: number,
    field: string,
    value: string | boolean | null | undefined
  ) => {
    setFamilyMembers((prev) => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  };

  // 更新單筆家族成員資料到資料庫
  const handleUpdateMember = async (member: Participant) => {
    // ✅ 先查詢最新活動 ID
    const { data: latestEvent, error: eventError } = await supabase
      .from("events")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (eventError || !latestEvent) {
      alert("無法取得最新活動資訊");
      return;
    }

    const updatedData = {
      name: member.name || "未填寫",
      address: member.address || "未填寫",
      birthday: member.birthday || "未填寫",
      family_id: member.family_id || "未填寫",
      event_date: member.event_date || "未填寫",
      participation_status: member.participation_status || "none",
      zodiac_sign: member.zodiac_sign || "未填寫",
      memo: member.memo || "未填寫",
      event_id: latestEvent.id, // ✅ 確保 `event_id` 是最新活動
      admin_viewed: false,
    };

    console.log("更新家族成員資料:", updatedData);

    const { error } = await supabase
      .from("participants")
      .update(updatedData)
      .eq("id_card", member.id_card)

    if (error) {
      alert("更新失敗：" + error.message);
    } else {
      alert(`基本資料更新成功！ \n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊`);
    }
  };



  // 更新基本資料（沒有家族成員時使用）
  const handleUpdateBasicInfo = async () => {
    if (!basicInfo) return;

    // ✅ 先查詢最新活動 ID
    const { data: latestEvent, error: eventError } = await supabase
      .from("events")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (eventError || !latestEvent) {
      alert("無法取得最新活動資訊");
      return;
    }

    const updatedData = {
      name: basicInfo.name || "未填寫",
      address: basicInfo.address || "未填寫",
      birthday: basicInfo.birthday || "未填寫",
      family_id: basicInfo.family_id || "未填寫",
      event_date: basicInfo.event_date || "event_date",
      participation_status: basicInfo.participation_status || "none",
      zodiac_sign: basicInfo.zodiac_sign || "未填寫",
      memo: basicInfo.memo || "未填寫",
      event_id: latestEvent.id, // ✅ 確保 `event_id` 是最新活動
      admin_viewed: false,
    };

    console.log("更新資料:", updatedData);

    const { error } = await supabase
      .from("participants")
      .update(updatedData)
      .eq("id_card", idCard)

    if (error) {
      alert("更新基本資料失敗：" + error.message);
    } else {
      alert(`基本資料更新成功！\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊`);
    }
  };

  return (
    <div className="card w-full shadow-xl bg-base-100">
      <div className="card-body space-y-4">
        <p className="text-center text-lg">請輸入您的身分證以查詢基本資料：</p>

        <div className="form-control">
          <label className="label">
            <span className="label-text">身分證</span>
          </label>
          <input
            type="text"
            placeholder="身分證"
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <button onClick={handleCheckId} className="btn btn-secondary w-full">
          查詢資料
        </button>

        {basicInfo && (
          <div className="card shadow-lg bg-base-50 mt-4">
            {/* <div className="card-body"> */}
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            {/* 若無家族成員，顯示編輯基本資料表單 */}
            {familyMembers.length === 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold">修改基本資料</h2>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">姓名</span>
                  </label>
                  <input
                    type="text"
                    value={basicInfo.name}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, name: e.target.value })
                    }
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">地址</span>
                  </label>
                  <input
                    type="text"
                    value={basicInfo.address || ""}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, address: e.target.value })
                    }
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">農曆生辰</span>
                  </label>
                  <input
                    type="text"
                    value={basicInfo.birthday || ""}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, birthday: e.target.value })
                    }
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">生肖</span>
                  </label>
                  <select
                    value={basicInfo?.zodiac_sign || ""}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, zodiac_sign: e.target.value })
                    }
                    className="select select-bordered w-full"
                  >
                    <option value="" disabled>請選擇您的生肖</option>
                    <option value="鼠">鼠</option>
                    <option value="牛">牛</option>
                    <option value="虎">虎</option>
                    <option value="兔">兔</option>
                    <option value="龍">龍</option>
                    <option value="蛇">蛇</option>
                    <option value="馬">馬</option>
                    <option value="羊">羊</option>
                    <option value="猴">猴</option>
                    <option value="雞">雞</option>
                    <option value="狗">狗</option>
                    <option value="豬">豬</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">代表人身分證字號</span>
                  </label>
                  <input
                    type="text"
                    value={basicInfo.family_id || ""}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, family_id: e.target.value })
                    }
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">參加梯次</span>
                  </label>
                  <select
                    value={basicInfo.event_date || ""}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, event_date: e.target.value })
                    }
                    className="select select-bordered w-full"
                  >
                    <option value="" disabled>請選擇梯次</option>
                    <option value="第一梯次">第一梯次</option>
                    <option value="第二梯次">第二梯次</option>
                    <option value="第三梯次">第三梯次</option>
                    <option value="第四梯次">第四梯次</option>
                    <option value="第五梯次">第五梯次</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">備註</span>
                  </label>
                  <input
                    type="text"
                    value={basicInfo.memo || ""}
                    required
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, memo: e.target.value })
                    }
                    className="input input-bordered w-full"
                  />
                </div>
                {/* 新增參加狀態選擇 */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBasicInfo({ ...basicInfo, participation_status: "join" })
                    }
                    className={`btn w-1/3 ${basicInfo.participation_status === "join"
                      ? "btn-success"
                      : "btn-outline"
                      }`}
                  >
                    參加
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBasicInfo({ ...basicInfo, participation_status: "none" })
                    }
                    className={`btn w-1/3 ${basicInfo.participation_status === "none"
                      ? "btn-error"
                      : "btn-outline"
                      }`}
                  >
                    不參加
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBasicInfo({ ...basicInfo, participation_status: "agent" })
                    }
                    className={`btn w-1/3 ${basicInfo.participation_status === "agent"
                      ? "btn-warning"
                      : "btn-outline"
                      }`}
                  >
                    代辦
                  </button>
                </div>

                <button
                  onClick={handleUpdateBasicInfo}
                  className="btn btn-primary w-full mt-2"
                >
                  更新基本資料
                </button>
              </div>
            )}

            {/* 顯示家族成員編輯區塊 */}
            {familyMembers.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">代表人身分證字號</h2>
                <ul className="space-y-4">
                  {familyMembers.map((member, index) => (
                    <li key={member.id_card} className="p-2 rounded shadow">
                      <div className="flex flex-col space-y-2">
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">姓名</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered"
                            value={member.name || ""}
                            required
                            onChange={(e) =>
                              handleFamilyMemberChange(index, "name", e.target.value)
                            }
                          />
                        </div>
                        {/* 地址 */}
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">地址</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered"
                            value={member.address || ""}
                            required
                            onChange={(e) =>
                              handleFamilyMemberChange(index, "address", e.target.value)
                            }
                          />
                        </div>
                        {/* 生辰 */}
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">農曆生辰</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered"
                            value={member.birthday || ""}
                            required
                            onChange={(e) =>
                              handleFamilyMemberChange(index, "birthday", e.target.value)
                            }
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">生肖</span>
                          </label>
                          <select
                            className="select select-bordered"
                            required
                            value={member.zodiac_sign || ""}
                            onChange={(e) =>
                              handleFamilyMemberChange(index, "zodiac_sign", e.target.value)
                            }
                          >
                            <option value="" disabled>請選擇生肖</option>
                            <option value="鼠">鼠</option>
                            <option value="牛">牛</option>
                            <option value="虎">虎</option>
                            <option value="兔">兔</option>
                            <option value="龍">龍</option>
                            <option value="蛇">蛇</option>
                            <option value="馬">馬</option>
                            <option value="羊">羊</option>
                            <option value="猴">猴</option>
                            <option value="雞">雞</option>
                            <option value="狗">狗</option>
                            <option value="豬">豬</option>
                          </select>
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">代表人身分證字號</span>
                          </label>
                          <input
                            type="text"
                            value={basicInfo.family_id || ""}
                            required
                            onChange={(e) =>
                              setBasicInfo({ ...basicInfo, family_id: e.target.value })
                            }
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">參加梯次</span>
                          </label>
                          <select
                            value={basicInfo.event_date || ""}
                            required
                            onChange={(e) =>
                              setBasicInfo({ ...basicInfo, event_date: e.target.value })
                            }
                            className="select select-bordered w-full"
                          >
                            <option value="" disabled>請選擇梯次</option>
                            <option value="第一梯次">第一梯次</option>
                            <option value="第二梯次">第二梯次</option>
                            <option value="第三梯次">第三梯次</option>
                            <option value="第四梯次">第四梯次</option>
                            <option value="第五梯次">第五梯次</option>
                          </select>
                        </div>


                        {/* 參加狀態 */}
                        <div className="flex gap-2 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleFamilyMemberChange(index, "participation_status", "join")
                            }
                            className={`btn w-1/3 ${member.participation_status === "join"
                              ? "btn-success"
                              : "btn-outline"
                              }`}
                          >
                            參加
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleFamilyMemberChange(index, "participation_status", "none")
                            }
                            className={`btn w-1/3 ${member.participation_status === "none"
                              ? "btn-error"
                              : "btn-outline"
                              }`}
                          >
                            不參加
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleFamilyMemberChange(index, "participation_status", "agent")
                            }
                            className={`btn w-1/3 ${member.participation_status === "agent"
                              ? "btn-warning"
                              : "btn-outline"
                              }`}
                          >
                            代辦
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateMember(member)}
                          className="btn btn-primary w-full"
                        >
                          提交
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          // </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantQuery;
