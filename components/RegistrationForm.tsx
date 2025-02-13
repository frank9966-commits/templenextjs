// RegistrationForm.tsx
import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface RegistrationFormProps {
  currentEvent: { id: number; title: string };
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ currentEvent }) => {
  const router = useRouter();
  const [idCard, setIdCard] = useState("");
  const [basicInfo, setBasicInfo] = useState<{ name: string } | null>({ name: "" });
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [familyId, setFamilyId] = useState("");
  const [selectedParticipate, setSelectedParticipate] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 檢查必填欄位
    if (!idCard || !basicInfo?.name || !address || !birthday || selectedParticipate === null) {
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
      participation_status: selectedParticipate ? "join" : "none",
    };

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
        // 參加者才顯示付款資訊
        if (selectedParticipate) {
          alert(
            `名子: ${basicInfo.name} 註冊與報名成功！\n\n報名成功，記得繳交費用。\n一、帳號: 中國信託822-10454-029-5035\n（請註明帳號末四碼或截圖給蓉蓉師姊）\n二、LINE Pay轉給蓉蓉師姊`
          );
        } else {
          alert(`名子: ${basicInfo.name} 註冊與報名成功！`);
        }
        window.location.reload();
      }
    } else {
      // 若資料已存在，則跳轉到已註冊頁面
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
            <span className="label-text">生辰</span>
          </label>
          <input
            type="text"
            placeholder="範例：八十四年四月二十七日 亥時。 如不知時辰，請寫吉時"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="input input-bordered w-full"
          />
          <p className=" text-xs mt-2">範例：八十四年四月二十七日 亥時。 如不知時辰，請寫吉時</p>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">生肖</span>
          </label>
          <input
            type="text"
            placeholder="輸入您的生肖"
            value={zodiacSign}
            onChange={(e) => setZodiacSign(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">關係人 (家族代號)</span>
          </label>
          <input
            type="text"
            placeholder="家族代號"
            value={familyId}
            onChange={(e) => setFamilyId(e.target.value)}
            className="input input-bordered w-full"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedParticipate(true)}
            className={`btn w-1/2 ${selectedParticipate === true ? "btn-success" : "btn-outline"}`}
          >
            參加
          </button>
          <button
            type="button"
            onClick={() => setSelectedParticipate(false)}
            className={`btn w-1/2 ${selectedParticipate === false ? "btn-error" : "btn-outline"}`}
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
  );
};

export default RegistrationForm;
