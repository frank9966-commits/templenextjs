import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface DonationsFormProps {
  currentEvent: { id: number; title: string };
}

const DonationsForm: React.FC<DonationsFormProps> = ({ currentEvent }) => {
  const router = useRouter();
  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{ name: string } | null>({ name: "" });
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [donations_memo, setDonations_memo] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [error, setError] = useState("");
  const [sex, setSex] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 1. 檢查必填欄位
    if (!idCard || !basicInfo?.name || !address || !birthday || !sex || !donationAmount) {
      setError("所有欄位皆為必填，請完整填寫表單。");
      return;
    }

    // 3. 驗證捐款金額
    const donationAmountNum = parseFloat(donationAmount);
    if (isNaN(donationAmountNum) || donationAmountNum <= 0) {
      setError("請輸入正確的捐款金額（必須為正數）。");
      return;
    }

    // 4. 建立參與者資料物件（participants 表）
    const participantData = {
      id_card: idCard.toUpperCase(), // 確保身分證為大寫
      name: basicInfo.name,
      address,
      birthday,
      donations_events: currentEvent.id,
      family_id: familyId || idCard.toUpperCase(),
      sex,
    };

    // 5. 先檢查參與者是否存在，取得 participantId
    let participantId: number | null = null;
    const { data: existed, error: fetchError } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", idCard.toUpperCase())
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 表示查無資料，這是正常情況，不應視為錯誤
      setError("查詢參與者失敗：" + fetchError.message);
      return;
    }

    if (!existed) {
      // 若不存在，則創建新參與者
      const { data: newParticipant } = await supabase
        .from("participants")
        .insert([participantData])
        .select("*")
        .single();


      if (!newParticipant) {
        setError("報名失敗：無法取得插入後的參與者資料");
        return;
      }

      participantId = newParticipant.id;
    } else {
      participantId = existed.id;
    }

    // 6. 先更新活動總金額（使用樂觀鎖 Optimistic Locking 防止超賣）
    // 取得當前活動資料
    const { data: eventData, error: eventFetchError } = await supabase
      .from("donations_events")
      .select("id, total_amount")
      .eq("id", currentEvent.id)
      .single();

    if (eventFetchError || !eventData) {
      setError("無法取得活動資料：" + (eventFetchError?.message || "未知錯誤"));
      return;
    }

    // 檢查餘額是否足夠
    if (eventData.total_amount < donationAmountNum) {
      setError("捐款金額不能超過活動總金額。");
      return;
    }

    const newTotal = eventData.total_amount - donationAmountNum;

    // 嘗試更新金額，並檢查 total_amount 是否仍為我們剛讀取的值 (樂觀鎖)
    const { data: updatedEvent, error: updateEventError } = await supabase
      .from("donations_events")
      .update({ total_amount: newTotal })
      .eq("id", currentEvent.id)
      .eq("total_amount", eventData.total_amount) // 關鍵：確保更新時金額未被其他人修改
      .select();

    if (updateEventError) {
      setError("更新活動總金額失敗：" + updateEventError.message);
      return;
    }

    // 如果沒有更新任何資料，表示 total_amount 已經被其他人改過了
    if (!updatedEvent || updatedEvent.length === 0) {
      setError("很抱歉，就在剛才額度已被搶光或變動，請重新嘗試。");
      return;
    }

    // 7. 進行捐款：新增捐款紀錄
    const { error: donationError } = await supabase
      .from("donations")
      .insert([
        {
          event_id: currentEvent.id,
          participant_id: participantId,
          donation_amount: donationAmountNum,
          donations_memo: donations_memo,
        },
      ]);

    if (donationError) {
      // 如果捐款紀錄插入失敗，理論上應該要補償(rollback)活動金額，但前端做 rollback 有風險。
      // 這裡先提示錯誤，請管理員處理。
      console.error("Critical Error: Quota deducted but donation record failed.", donationError);
      setError("捐款紀錄建立失敗，但額度已扣除。請聯繫管理員處理。" + donationError.message);
      return;
    }

    alert("註冊與捐款成功！\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊");
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} className="card w-full shadow-xl bg-base-100">
      <div className="card-body space-y-4">
        {/* 身分證 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">身分證</span>
          </label>
          <input
            type="text"
            placeholder="身分證（例如：A123456789）"
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        {/* 姓名 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">姓名</span>
          </label>
          <input
            type="text"
            placeholder="姓名"
            value={basicInfo?.name || ""}
            onChange={(e) =>
              setBasicInfo((prev) => ({ ...prev, name: e.target.value }))
            }
            className="input input-bordered w-full"
          />
        </div>
        {/* 🔧 性別欄位 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">性別</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sex"
                value="男"
                checked={sex === "男"}
                onChange={(e) => setSex(e.target.value)}
                className="radio border-blue-400 checked:bg-blue-500"
              />
              <span>信士(男)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sex"
                value="女"
                checked={sex === "女"}
                onChange={(e) => setSex(e.target.value)}
                className="radio border-orange-400 checked:bg-orange-400"
              />
              <span>信女(女)</span>
            </label>
          </div>
        </div>
        {/* 地址 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">地址</span>
          </label>
          <input
            type="text"
            placeholder="地址"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        {/* 農曆生辰 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">農曆生辰</span>
          </label>
          <input
            type="text"
            placeholder="範例：八十四年四月二十七日 亥時。如不知時辰，請寫吉時"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="input input-bordered w-full"
          />
          <p className="text-xs mt-2">
            範例：八十四年四月二十七日 亥時。如不知時辰，請寫吉時
          </p>
        </div>
        {/* 代表人身分證字號 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">代表人身分證字號</span>
          </label>
          <input
            type="text"
            placeholder="代表人身分證字號（例如：A123456789）"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>
        {/* 備註 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">備註</span>
          </label>
          <textarea
            placeholder="範例：將功德回饋給xxx"
            value={donations_memo}
            onChange={(e) => setDonations_memo(e.target.value)}
            className="textarea textarea-bordered w-full h-24"
          />
        </div>
        {/* 捐款金額 */}
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
            min="1" // 限制最小值為 1
            step="1" // 限制只能輸入整數
          />
        </div>
        <button type="submit" className="w-full mt-2 px-6 py-3 rounded-lg bg-[#F57C00] text-white text-lg font-bold hover:opacity-90">
          註冊與捐款
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </form>
  );
};

export default DonationsForm;