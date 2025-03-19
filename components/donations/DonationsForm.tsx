import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DonationsFormProps {
  currentEvent: { id: number; title: string };
}

const DonationsForm: React.FC<DonationsFormProps> = ({ currentEvent }) => {
  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{ name: string } | null>({ name: "" });
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [donations_memo, setDonations_memo] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [donationAmount, setDonationAmount] = useState("");
  const [error, setError] = useState("");

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
    if (!idCard || !basicInfo?.name || !address || !birthday || !donationAmount) {
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
      zodiac_sign: zodiacSign,
      family_id: familyId || idCard.toUpperCase(),
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

    // 6. 進行捐款：每次都「新增一筆」捐款紀錄
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
      setError("捐款失敗：" + donationError.message);
      return;
    }

    // 7. 更新活動的總金額（假設 donations_events 表中有 total_amount）
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
      setError("活動餘額不足，扣款失敗");
      return;
    }

    const newTotal = eventData.total_amount - donationAmountNum;
    const { error: updateEventError } = await supabase
      .from("donations_events")
      .update({ total_amount: newTotal })
      .eq("id", currentEvent.id);

    if (updateEventError) {
      setError("更新活動總金額失敗：" + updateEventError.message);
      return;
    }

    alert("註冊與捐款成功！\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊");
    window.location.reload();
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
        {/* 生肖 */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">生肖</span>
          </label>
          <select
            value={zodiacSign}
            onChange={(e) => setZodiacSign(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="" disabled>
              請選擇您的生肖
            </option>
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
        <button type="submit" className="btn btn-primary w-full">
          註冊與捐款
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </form>
  );
};

export default DonationsForm;