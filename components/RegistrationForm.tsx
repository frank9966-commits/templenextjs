// RegistrationForm.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface RegistrationFormProps {
  currentEvent: { id: number; title: string };
}

// 定義三種參加狀態
type ParticipationStatus = "join" | "none" | "agent";

const RegistrationForm: React.FC<RegistrationFormProps> = ({ currentEvent }) => {
  const router = useRouter();
  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{ name: string } | null>({ name: "" });
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [memo, setMemo] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [eventDate, setEventDate] = useState("");

  // participationStatus可以是null，表示還沒選擇；或是 "join"/"none"/"agent"
  const [participationStatus, setParticipationStatus] = useState<ParticipationStatus | null>(null);

  const [error, setError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 將輸入轉換為大寫，避免因使用者輸入小寫導致驗證失敗
    const normalizedId = idCard.toUpperCase();

    // 使用 normalizedId 進行驗證
    if (!validateTaiwanIDFormat(normalizedId)) {
      setError("身分證格式不正確，請輸入正確格式（例如 A123456789）");
      return;
    }

    // 檢查必填欄位 (參加狀態不能是 null)
    if (!idCard || !basicInfo?.name || !address || !birthday || !participationStatus) {
      setError("所有欄位皆為必填，請完整填寫表單。");
      return;
    }

    const participantData = {
      id_card: idCard,
      name: basicInfo.name,
      address,
      birthday,
      event_id: currentEvent.id,
      zodiac_sign: zodiacSign,
      family_id: familyId,
      memo: memo,
      participation_status: participationStatus, // 直接用字串
      event_date: eventDate,
    };
    console.log(participantData)

    // 檢查是否已存在該 id
    const { data: existed, error: fetchError } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", idCard)
      .single();

    if (fetchError || !existed) {
      // 若資料不存在則 Insert 新資料
      const { error: insertError } = await supabase
        .from("participants")
        .insert([participantData]);

      if (insertError) {
        setError("報名失敗：" + insertError.message);
      } else {
        // 依狀態彈出提示
        if (participationStatus === "join") {
          alert(
            `名子: ${basicInfo.name} 註冊與報名成功！\n\n報名成功，記得繳交費用。\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊`
          );
        } else if (participationStatus === "agent") {
          alert(`名子: ${basicInfo.name} 註冊與代辦成功！後續相關事宜請和管理員聯繫。`);
        } else {
          // "none"
          alert(`名子: ${basicInfo.name} 註冊成功但選擇不參加。`);
        }
        window.location.reload();
      }
    } else {
      // 若資料已存在
      alert("此身分證已註冊過");
      router.push("/");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card w-full shadow-xl bg-base-100">
      <div className="card-body space-y-4">
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

        <div className="form-control">
          <label className="label">
            <span className="label-text">姓名</span>
          </label>
          <input
            type="text"
            placeholder="姓名"
            onChange={(e) =>
              setBasicInfo((prev) => ({ ...prev, name: e.target.value }))
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
            placeholder="地址"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">農曆生辰</span>
          </label>
          <input
            type="text"
            placeholder="範例：八十四年四月二十七日 亥時。 如不知時辰，請寫吉時"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="input input-bordered w-full"
          />
          <p className=" text-xs mt-2">
            範例：八十四年四月二十七日 亥時。 如不知時辰，請寫吉時
          </p>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">生肖</span>
          </label>
          <select
            value={zodiacSign}
            onChange={(e) => setZodiacSign(e.target.value)}
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
            placeholder="代表人身分證字號"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">參加梯次</span>
          </label>
          <select
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
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
          <textarea
            placeholder="範例：神尊指示注意事項"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="textarea textarea-bordered w-full h-24"
          />

        </div>

        {/* 三個狀態按鈕 */}
        <div className="flex mr-4 gap-2">
          <button
            type="button"
            onClick={() => setParticipationStatus("join")}
            className={`btn w-1/3 ${participationStatus === "join" ? "btn-success" : "btn-outline"
              }`}
          >
            參加
          </button>
          <button
            type="button"
            onClick={() => setParticipationStatus("none")}
            className={`btn w-1/3 ${participationStatus === "none" ? "btn-error" : "btn-outline"
              }`}
          >
            不參加
          </button>
          <button
            type="button"
            onClick={() => setParticipationStatus("agent")}
            className={`btn w-1/3 ${participationStatus === "agent" ? "btn-warning" : "btn-outline"
              }`}
          >
            代辦
          </button>
        </div>

        <button type="submit" className="btn btn-primary w-full">
          送出報名
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </form>
  );
};

export default RegistrationForm;
