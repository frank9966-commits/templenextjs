// RegistrationForm.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface RegistrationFormProps {
  currentEvent: { id: number; title: string };
}

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
  const [sex, setSex] = useState("");
  const [agencyName, setAgencyName] = useState("");

  const [participationStatus, setParticipationStatus] = useState<ParticipationStatus | null>(null);
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

    const trimmedIdCard = idCard.trim();
    const trimmedName = basicInfo?.name.trim() || "";
    const trimmedAddress = address.trim();
    const trimmedBirthday = birthday.trim();
    const trimmedFamilyId = familyId.trim();
    const trimmedMemo = memo.trim();
    const trimmedZodiacSign = zodiacSign.trim();
    const trimmedEventDate = eventDate.trim();
    const trimmedSex = sex.trim();
    const trimmedAgencyName = agencyName.trim();

    if (!trimmedIdCard || !trimmedName || !trimmedAddress || !trimmedBirthday || !participationStatus) {
      setError("所有欄位皆為必填，請完整填寫表單。");
      return;
    }

    if (participationStatus === "agent" && !trimmedAgencyName) {
      setError("請輸入代辦人名稱。");
      return;
    }

    const participantData = {
      id_card: trimmedIdCard,
      name: trimmedName,
      address: trimmedAddress,
      birthday: trimmedBirthday,
      event_id: currentEvent.id,
      zodiac_sign: trimmedZodiacSign,
      family_id: trimmedFamilyId || trimmedIdCard.toUpperCase(),
      memo: trimmedMemo,
      participation_status: participationStatus,
      event_date: trimmedEventDate,
      sex: trimmedSex,
      agency_name: participationStatus === "agent" ? trimmedAgencyName : null,
    };

    const { data: existed, error: fetchError } = await supabase
      .from("participants")
      .select("*")
      .eq("id_card", trimmedIdCard)
      .single();

    if (fetchError || !existed) {
      const { error: insertError } = await supabase
        .from("participants")
        .insert([participantData]);

      if (insertError) {
        setError("報名失敗：" + insertError.message);
      } else {
        if (participationStatus === "join") {
          alert(
            `名字: ${trimmedName} 註冊與報名成功！\n\n報名成功，記得繳交費用。\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊`
          );
        } else if (participationStatus === "agent") {
          alert(`名字: ${trimmedName} 註冊與代辦成功！後續相關事宜請和管理員聯繫。`);
        } else {
          alert(`名字: ${trimmedName} 註冊成功但選擇不參加。`);
        }
        window.location.reload();
      }
    } else {
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

        {/* 🔧 新增的性別欄位 */}
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
          <p className="text-xs mt-2">
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
            <option value="" disabled>
              請選擇梯次
            </option>
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

        <div className="flex mr-4 gap-2">
          {/* 參加 */}
          <button
            type="button"
            onClick={() => setParticipationStatus("join")}
            className={`w-1/3 px-4 py-2 rounded-lg text-black font-bold transition duration-200 ease-in-out
      ${participationStatus === "join" ? "bg-[#FFA9A1]" : "border border-gray-400 bg-white"}
    `}
          >
            參加
          </button>

          {/* 不參加 */}
          <button
            type="button"
            onClick={() => setParticipationStatus("none")}
            className={`w-1/3 px-4 py-2 rounded-lg text-black font-bold transition duration-200 ease-in-out
      ${participationStatus === "none" ? "bg-[#FFF5B1]" : "border border-gray-400 bg-white"}
    `}
          >
            不參加
          </button>

          {/* 代辦 */}
          <button
            type="button"
            onClick={() => setParticipationStatus("agent")}
            className={`w-1/3 px-4 py-2 rounded-lg text-black font-bold transition duration-200 ease-in-out
      ${participationStatus === "agent" ? "bg-[#ADE3DA]" : "border border-gray-400 bg-white"}
    `}
          >
            代辦
          </button>
        </div>

        {participationStatus === "agent" && (
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">代辦者姓名</span>
            </label>
            <input
              type="text"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="input input-bordered w-full"
              placeholder="請輸入代辦者姓名"
              required
            />
          </div>
        )}

        {/* 送出按鈕 */}
        <button
          type="submit"
          className="w-full mt-4 px-6 py-3 rounded-lg bg-[#78AEE5] text-white text-lg font-bold hover:opacity-90"
        >
          送出報名
        </button>
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </form>
  );
};

export default RegistrationForm;
