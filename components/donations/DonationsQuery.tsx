// DonationsQuery.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DonationsQueryProps {
  currentEvent: { id: number; title: string; total_amount: number };
}

export interface Participant {
  id: number;
  id_card: string;
  name: string;
  address?: string;
  birthday?: string;
  family_id?: string;
  event_id?: number;
  donations_memo?: string;
  agency_name?: string;
  sex?: string;
}

const DonationsQuery: React.FC<DonationsQueryProps> = ({ currentEvent: _currentEvent }) => {
  void _currentEvent;

  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{
    name: string;
    address?: string;
    birthday?: string;
    family_id?: string;
    event_id?: number;
    donations_memo?: string;
    agency_name?: string;
    sex?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [familyMembers, setFamilyMembers] = useState<Participant[]>([]);
  // 新增：存放參與者 id（用於查詢捐款紀錄）
  const [participantId, setParticipantId] = useState<number | null>(null);
  // 新增：捐款金額狀態（字串型態，輸入框使用）
  const [donationAmount, setDonationAmount] = useState("");
  const [familyDonationAmounts, setFamilyDonationAmounts] = useState<string[]>([]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCheckId = async () => {
    if (!idCard) return;
    setError("");
    const normalizedId = idCard.toUpperCase();

    // 查詢參與者基本資料
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", normalizedId)
      .single();

    if (error || !data) {
      setError("找不到基本資料，請手動輸入");
      setBasicInfo(null);
      setFamilyMembers([]);
      setParticipantId(null);
      setDonationAmount("");
    } else {
      // 將資料存入 state，並記錄參與者 id
      setBasicInfo({
        name: data.name,
        address: data.address,
        birthday: data.birthday,
        family_id: data.family_id || normalizedId,
        donations_memo: data.donations_memo,
        agency_name: data.agency_name || "",
        sex: data.sex || "",
      });
      setParticipantId(data.id);

      // 查詢家族成員
      const familyIdToQuery = data.family_id || normalizedId;
      const { data: familyData, error: familyError } = await supabase
        .from("participants")
        .select("*")
        .eq("family_id", familyIdToQuery);
      // 取得家族成員後：
      if (familyError) {
        setError("無法取得家族成員資料：" + familyError.message);
        setFamilyMembers([]);
        setFamilyDonationAmounts([]);
      } else {
        const filteredFamily = familyData.filter((m) => m.id_card !== normalizedId);
        setFamilyMembers(filteredFamily);
        // 初始化捐款金額陣列，與家族成員數量相同，初始皆為空字串
        setFamilyDonationAmounts(new Array(filteredFamily.length).fill(""));
      }


      // 查詢該參與者在當前活動下的捐款紀錄
      const { data: donationData, error: donationError } = await supabase
        .from("donations")
        .select("*")
        .eq("event_id", _currentEvent.id)
        .eq("participant_id", data.id)
        .single();
      if (!donationError && donationData) {
        setDonationAmount("");
      } else {
        setDonationAmount("");
      }
    }
  };

  const handleFamilyDonation = async (index: number, member: Participant & { id: number }) => {
    const donationValueStr = familyDonationAmounts[index];
    const donationValue = parseFloat(donationValueStr);
    if (isNaN(donationValue) || donationValue <= 0) {
      alert("請輸入正確的捐款金額");
      return;
    }
    if (donationValue > _currentEvent.total_amount) {
      alert("捐款金額不能超過活動總金額");
      return;
    }

    // 新增該家族成員的捐款紀錄
    const { error: insertError } = await supabase
      .from("donations")
      .insert([
        {
          event_id: _currentEvent.id,
          participant_id: member.id,  // 注意：請確保 member 資料中有 id 欄位
          donation_amount: donationValue,
        },
      ])
      .single();
    if (insertError) {
      alert("新增家族捐款紀錄失敗：" + insertError.message);
      return;
    } else {
      alert("家族捐款紀錄新增成功！\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊");
    }

    // 扣除活動金額（與主捐款邏輯相同）
    const { data: eventData, error: eventFetchError } = await supabase
      .from("donations_events")
      .select("*")
      .eq("id", _currentEvent.id)
      .single();
    if (eventFetchError || !eventData) {
      alert("無法取得活動資料");
      return;
    }
    if (eventData.id !== _currentEvent.id) {
      alert("活動 ID 不匹配，無法扣款");
      return;
    }
    const newTotalAmount = eventData.total_amount - donationValue;
    const { error: updateEventError } = await supabase
      .from("donations_events")
      .update({ total_amount: newTotalAmount })
      .eq("id", _currentEvent.id);
    if (updateEventError) {
      alert("捐款失敗");
    } else {
      alert("活動金額扣除成功，剩餘：" + newTotalAmount);
    }
  };

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

  // 處理捐款紀錄的更新（若無則新增）
  const handleUpdateDonation = async () => {
    if (!participantId) {
      alert("尚未取得參與者資料");
      return;
    }

    const donationAmountNum = parseFloat(donationAmount);
    if (isNaN(donationAmountNum) || donationAmountNum <= 0) {
      alert("請輸入正確的捐款金額");
      return;
    }

    // 先檢查餘額是否足夠（這邊可以留給 RPC 做檢查，但前端也可以先提示）
    if (donationAmountNum > _currentEvent.total_amount) {
      alert("捐款金額不能超過活動總金額");
      return;
    }

    // 新增捐款紀錄（與原邏輯類似）
    const { error: insertError } = await supabase
      .from("donations")
      .insert([
        {
          event_id: _currentEvent.id,
          participant_id: participantId,
          donation_amount: donationAmountNum,
          donation_note: basicInfo?.donations_memo || ""
        },
      ])
      .single();

    if (insertError) {
      alert("新增捐款紀錄失敗：" + insertError.message);
      return;
    } else {
      alert("捐款紀錄新增成功！\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊");
    }

    // 呼叫 RPC 函數，讓資料庫原子性地扣除活動金額
    const { data: rpcData, error: rpcError } = await supabase
      .rpc("deduct_amount", {
        event_id: _currentEvent.id,   // 必須跟函數參數 event_id 對應
        amount: donationAmountNum     // 必須跟函數參數 amount 對應
      });

    if (rpcError) {
      alert("捐款失敗");
    } else {
      alert("活動金額扣除成功，剩餘：" + rpcData.toLocaleString());
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

        <button
          onClick={handleCheckId}
          className="w-full px-6 py-3 rounded-lg text-white bg-[#C299FF] hover:opacity-90 text-lg font-bold"
        >
          查詢資料
        </button>


        {basicInfo && (
          <div className="card shadow-lg bg-base-50 mt-4">
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <div className="mb-4">
              <h2 className="text-lg font-bold">我的基本資料</h2>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">姓名</span>
                </label>
                <input
                  type="text"
                  value={basicInfo.name}
                  readOnly
                  className="input input-bordered w-full"
                />
              </div>
              {/* 🔧 顯示性別 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">性別</span>
                </label>
                <input
                  type="text"
                  value={basicInfo.sex || ""}
                  readOnly
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
                  readOnly
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
                  readOnly
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">代表人身分證字號</span>
                </label>
                <input
                  type="text"
                  value={basicInfo.family_id || ""}
                  readOnly
                  className="input input-bordered w-full"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">備註</span>
                </label>
                <textarea
                  value={basicInfo.donations_memo || ""}
                  required
                  onChange={(e) =>
                    setBasicInfo({ ...basicInfo, donations_memo: e.target.value })
                  }
                  className="textarea textarea-bordered w-full h-24"
                  placeholder="範例：將功德回饋給xxx"
                />
              </div>
              {/* 新增：捐款金額輸入欄位 */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">捐款金額</span>
                </label>
                <input
                  type="number"
                  placeholder="請輸入捐款金額"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  className="input input-bordered w-full"
                  max={_currentEvent.total_amount}
                />
              </div>
              {/* 新增：更新捐款紀錄 */}
              <button
                onClick={handleUpdateDonation}
                className="w-full mt-2 px-6 py-3 rounded-lg bg-[#F57C00] text-white text-lg font-bold hover:opacity-90"
              >
                捐款
              </button>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold">家族成員</h2>
              {familyMembers.length > 0 ? (
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
                            readOnly
                          />
                        </div>
                        {/* 🔧 顯示性別 */}
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">性別</span>
                          </label>
                          <input
                            type="text"
                            value={member.sex || ""}
                            readOnly
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">地址</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered"
                            value={member.address || ""}
                            readOnly
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">農曆生辰</span>
                          </label>
                          <input
                            type="text"
                            className="input input-bordered"
                            value={member.birthday || ""}
                            readOnly
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">代表人身分證字號</span>
                          </label>
                          <input
                            type="text"
                            value={member.family_id || ""}
                            readOnly
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">備註</span>
                          </label>
                          <textarea
                            value={member.donations_memo || ""}
                            required
                            onChange={(e) =>
                              handleFamilyMemberChange(index, "donations_memo", e.target.value)
                            }
                            className="textarea textarea-bordered w-full h-24"
                            placeholder="範例：將功德回饋給xxx"
                          />
                        </div>
                        <div className="form-control">
                          <label className="label">
                            <span className="label-text">捐款金額</span>
                          </label>
                          <input
                            type="number"
                            placeholder="請輸入捐款金額"
                            value={familyDonationAmounts[index] || ""}
                            onChange={(e) => {
                              const newArr = [...familyDonationAmounts];
                              newArr[index] = e.target.value;
                              setFamilyDonationAmounts(newArr);
                            }}
                            className="input input-bordered w-full"
                            max={_currentEvent.total_amount}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFamilyDonation(index, member)}
                          className="btn w-full mt-2 px-6 py-3 rounded-lg bg-[#F57C00] text-white text-lg font-bold hover:opacity-90"
                        >
                          捐款
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center">目前無其他家族成員</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationsQuery;
