"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MembershipJoinPage() {
  const [idCard, setIdCard] = useState("");
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [cycleMonths, setCycleMonths] = useState<number | null>(null);

  const [idCardExistingName, setIdCardExistingName] = useState<string | null>(null);
  const [checkingIdCard, setCheckingIdCard] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const normalizedIdCard = useMemo(() => idCard.trim().toUpperCase(), [idCard]);

  const cycleAmount = useMemo(() => {
    switch (cycleMonths) {
      case 12:
        return 6000;
      case 6:
        return 3000;
      case 3:
        return 1500;
      case 1:
        return 500;
      default:
        return null;
    }
  }, [cycleMonths]);

  const cycleLabel = useMemo(() => {
    switch (cycleMonths) {
      case 12:
        return "年繳";
      case 6:
        return "半年繳";
      case 3:
        return "季繳";
      case 1:
        return "月繳";
      default:
        return null;
    }
  }, [cycleMonths]);

  useEffect(() => {
    const value = normalizedIdCard;
    if (!value) {
      setIdCardExistingName(null);
      setCheckingIdCard(false);
      return;
    }

    // 簡單判斷長度，避免每輸入一個字就打 DB
    if (value.length < 10) {
      setIdCardExistingName(null);
      setCheckingIdCard(false);
      return;
    }

    let cancelled = false;
    setCheckingIdCard(true);

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const { data, error } = await supabase
            .from("participants")
            .select("name")
            .eq("id_card", value)
            .maybeSingle();

          if (cancelled) return;
          if (error) {
            setIdCardExistingName(null);
            return;
          }

          setIdCardExistingName((data as { name?: string } | null)?.name ?? "");
        } finally {
          if (!cancelled) setCheckingIdCard(false);
        }
      })();
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalizedIdCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (
      !normalizedIdCard ||
      !name.trim() ||
      !sex.trim() ||
      !address.trim() ||
      !birthday.trim() ||
      !zodiacSign.trim()
    ) {
      setError("所有欄位皆為必填，請完整填寫。");
      return;
    }

    if (!cycleMonths || !cycleAmount || !cycleLabel) {
      setError("送出前請先選擇繳納方式（年繳/半年繳/季繳/月繳）。");
      return;
    }

    setLoading(true);
    try {
      // 取最新活動 id（避免 participants 表若有 event_id 必填造成寫入失敗）
      const { data: latestEvent, error: eventError } = await supabase
        .from("events")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (eventError || !latestEvent) {
        throw new Error("無法取得最新活動資訊");
      }

      const payload = {
        id_card: normalizedIdCard,
        name: name.trim(),
        sex: sex.trim(),
        address: address.trim(),
        birthday: birthday.trim(),

        // 其餘欄位給合理預設，避免 DB 欄位限制
        event_id: (latestEvent as { id: number }).id,
        participation_status: "none",
        event_date: "未填寫",
        family_id: normalizedIdCard,
        zodiac_sign: zodiacSign.trim(),
        memo: `會員首次入會；繳納方式：${cycleLabel}（${cycleAmount}元）`,
        admin_viewed: false,
        agency_name: null,
      };

      const { error: upsertError } = await supabase
        .from("participants")
        .upsert(payload, { onConflict: "id_card" });

      if (upsertError) throw upsertError;

      setInfo("已送出首次入會資料，請等待管理員協助開通會籍。");
      setIdCard("");
      setName("");
      setSex("");
      setAddress("");
      setBirthday("");
      setZodiacSign("");
      setCycleMonths(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "送出失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content flex-col w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="card w-full shadow-xl bg-base-100">
          <div className="card-body space-y-4">
            <h1 className="text-2xl font-bold text-center">首次入會</h1>

            <div className="text-sm text-gray-700 leading-7">
              <p className="text-center font-bold">🔸歡迎加入社團法人無極天王宮🔸</p>
              <p className="mt-3">
                無極天王宮秉持
                <br />
                弘揚正信道教、濟世利人、安定人心之宗旨,
                <br />
                誠摯邀請有緣善信一同護持道業、共修善行。
              </p>
              <p className="mt-3">
                成為本宮會員,不僅是護持宮務的力量,
                <br />
                更是一份與神明結緣、累積福德、共行善道的心意。
              </p>
            </div>

            <div className="rounded-lg bg-base-200/50 p-4 text-sm text-gray-800 leading-7">
              <p className="font-bold mb-2">會員入會說明</p>
              <p>新入會員需繳交:</p>
              <p>・入會費:新台幣1,000元</p>
              <p className="mt-2">會費說明:</p>
              <p>會費一年為新台幣6,000元</p>
              <p>可依需求選擇以下方式繳納:</p>
              <p>・年繳：6,000元</p>
              <p>・半年繳：3,000元</p>
              <p>・季繳：1,500元</p>
              <p>・月繳：500元</p>
            </div>

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

              {checkingIdCard ? (
                <p className="text-xs mt-2 text-gray-500">正在檢查是否已填過資料...</p>
              ) : idCardExistingName !== null ? (
                <div className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-sm text-gray-800 leading-6">
                  <p className="font-bold">提醒</p>
                  <p>
                    此身分證已存在資料{idCardExistingName ? `（姓名：${idCardExistingName}）` : ""}。
                    本頁送出會更新既有資料；若您要辦理會員續費，請改用「會員續費」頁面。
                  </p>
                </div>
              ) : null}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">姓名</span>
              </label>
              <input
                type="text"
                placeholder="姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

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
                className="select select-bordered w-full"
                value={zodiacSign}
                onChange={(e) => setZodiacSign(e.target.value)}
              >
                <option value="" disabled>
                  請選擇生肖
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

            <div className="rounded-lg bg-base-200/50 p-4 text-sm text-gray-800 leading-7">
              <p className="font-bold text-gray-800">◆ 會員繳費方式</p>
              <div className="inline-flex items-center mt-2 px-3 py-1 rounded bg-success/10 text-success font-bold">
                轉帳
              </div>
              <div className="mt-2">
                <div>戶名：無極天王宮道教協會</div>
                <div>郵局代號：700</div>
                <div>郵局帳號：0031620-0136581</div>
              </div>

              <div className="my-3" />
              <p>
                感恩您的善心護持,
                <br />
                每一份會費,
                <br />
                皆為弘道濟世的一份力量。
              </p>
            </div>

            <div className="mt-2">
              <p className="font-bold text-gray-800">◆ 會費繳納方式（送出前必選）</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`btn ${cycleMonths === 12 ? "btn-info" : "btn-outline btn-info"}`}
                  onClick={() => setCycleMonths(12)}
                >
                  年繳 6000
                </button>
                <button
                  type="button"
                  className={`btn ${cycleMonths === 6 ? "btn-warning" : "btn-outline btn-warning"}`}
                  onClick={() => setCycleMonths(6)}
                >
                  半年繳 3000
                </button>
                <button
                  type="button"
                  className={`btn ${cycleMonths === 3 ? "btn-secondary" : "btn-outline btn-secondary"}`}
                  onClick={() => setCycleMonths(3)}
                >
                  季繳 1500
                </button>
                <button
                  type="button"
                  className={`btn ${cycleMonths === 1 ? "btn-success" : "btn-outline btn-success"}`}
                  onClick={() => setCycleMonths(1)}
                >
                  月繳 500
                </button>
              </div>
              {cycleLabel && cycleAmount !== null ? (
                <p className="text-xs mt-2 text-gray-600">
                  已選擇：{cycleLabel}（{cycleAmount}元）
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 rounded-lg text-white bg-[#C299FF] hover:opacity-90 text-lg font-bold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "送出中..." : "送出首次入會"}
            </button>

            {error && <p className="text-red-500 text-center">{error}</p>}
            {info && <p className="text-center text-gray-700">{info}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
