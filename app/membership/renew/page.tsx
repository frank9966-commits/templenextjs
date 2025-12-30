"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  computeNextRenewalWithCycle,
  isReminderNeeded,
  type DateOnly,
} from "@/lib/membership";

type MembershipRow = {
  id: number;
  id_card: string;
  effective_from: DateOnly;
  expires_on: DateOnly;
  next_due_on: DateOnly;
  cycle_months?: number;
  status: "active" | "inactive";
};

type RenewalRow = {
  id: number;
  membership_id: number;
  period_start: DateOnly;
  period_end: DateOnly;
  cycle_months: number;
  requested_at: string;
  admin_status: "pending" | "paid" | "unpaid";
};

export default function MembershipRenewPage() {
  const [idCard, setIdCard] = useState("");
  const [membership, setMembership] = useState<MembershipRow | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [latestRenewal, setLatestRenewal] = useState<RenewalRow | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [cycleMonths, setCycleMonths] = useState<number | null>(null);

  const normalizedIdCard = useMemo(() => idCard.trim().toUpperCase(), [idCard]);

  const pending = latestRenewal?.admin_status === "pending";
  const needReminder = membership
    ? isReminderNeeded({ nextDueOn: membership.next_due_on })
    : false;

  const handleCheck = async () => {
    setError(null);
    setInfo(null);
    setDeclined(false);
    setShowPayment(false);
    setCycleMonths(null);
    setChecked(false);
    setMembership(null);
    setMemberName(null);
    setLatestRenewal(null);

    if (!normalizedIdCard) {
      setError("請輸入身分證");
      return;
    }

    setLoading(true);
    try {
      const { data: m, error: mErr } = await supabase
        .from("memberships")
        .select("id, id_card, effective_from, expires_on, next_due_on, status")
        .eq("id_card", normalizedIdCard)
        .maybeSingle();

      if (mErr) throw mErr;

      if (!m) {
        // 進一步判斷：是沒註冊？還是已註冊但尚未建立會籍？
        const { data: p, error: pErr } = await supabase
          .from("participants")
          .select("id_card, name")
          .eq("id_card", normalizedIdCard)
          .maybeSingle();

        if (pErr) throw pErr;

        setChecked(true);
        if (!p) {
          setInfo("查無此身分證資料，請先完成註冊或洽管理員。");
        } else {
          setMemberName((p as { name?: string } | null)?.name ?? null);
          setInfo("已找到會員資料，但尚未建立會籍，請洽管理員開通會籍。");
        }
        return;
      }

      const membershipRow = m as MembershipRow;
      setMembership(membershipRow);

      // 取得姓名（顯示用）
      const { data: p2, error: p2Err } = await supabase
        .from("participants")
        .select("name")
        .eq("id_card", membershipRow.id_card)
        .maybeSingle();

      if (!p2Err && p2) {
        setMemberName((p2 as { name?: string } | null)?.name ?? null);
      }

      const { data: r, error: rErr } = await supabase
        .from("membership_renewal_requests")
        .select(
          "id, membership_id, period_start, period_end, cycle_months, requested_at, admin_status"
        )
        .eq("membership_id", membershipRow.id)
        .order("requested_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (rErr) throw rErr;

      setLatestRenewal((r as RenewalRow) ?? null);
      setChecked(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查詢失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewYes = () => {
    setDeclined(false);
    setShowPayment(true);
    setInfo(null);
    setError(null);
    setCycleMonths(null);
  };

  const handleSubmitRenewal = async () => {
    if (!membership) return;
    if (!cycleMonths) {
      setError("請先選擇繳費方式（年繳/半年繳/季繳/月繳）");
      return;
    }

    setError(null);
    setInfo(null);

    if (pending) {
      setInfo("已送出續會申請，待管理員確認後即可。");
      return;
    }

    setLoading(true);
    try {
      const { periodStart, periodEnd, newExpiresOn, newNextDueOn } =
        computeNextRenewalWithCycle({
          expiresOn: membership.expires_on,
          nextDueOn: membership.next_due_on,
          cycleMonths,
        });

      // 記錄本期會員回覆（續會）
      const { error: respErr } = await supabase
        .from("membership_renewal_responses")
        .upsert(
          {
            membership_id: membership.id,
            period_start: periodStart,
            response: "renew",
            cycle_months: cycleMonths,
          },
          { onConflict: "membership_id,period_start" }
        );

      if (respErr) throw respErr;

      // 建立續會申請（待審核）
      const { error: upsertErr } = await supabase
        .from("membership_renewal_requests")
        .upsert(
          {
            membership_id: membership.id,
            period_start: periodStart,
            period_end: periodEnd,
            cycle_months: cycleMonths,
            admin_status: "pending",
          },
          { onConflict: "membership_id,period_start" }
        );

      if (upsertErr) throw upsertErr;

      // 依需求：續會後立刻順延到期日
      const { error: updErr } = await supabase
        .from("memberships")
        .update({
          expires_on: newExpiresOn,
          next_due_on: newNextDueOn,
          cycle_months: cycleMonths,
          last_renew_requested_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", membership.id);

      if (updErr) throw updErr;

      setInfo("續會申請已送出，已先順延到期日，待管理員確認收款。");
      setShowPayment(false);
      await handleCheck();
    } catch (e) {
      setError(e instanceof Error ? e.message : "續會失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleRenewNo = async () => {
    setError(null);
    setInfo(null);
    setDeclined(true);
    setShowPayment(false);

    // 沒有 membership 代表還沒查到會籍，不記錄
    if (!membership) {
      setInfo("好的，若您之後要續會可再查詢。");
      return;
    }

    try {
      const periodStart = membership.next_due_on;
      const { error: respErr } = await supabase
        .from("membership_renewal_responses")
        .upsert(
          {
            membership_id: membership.id,
            period_start: periodStart,
            response: "decline",
          },
          { onConflict: "membership_id,period_start" }
        );

      if (respErr) throw respErr;
      setInfo("已記錄您本期回覆不續費。");
    } catch {
      // 記錄失敗不阻擋使用者流程
      setInfo("好的，若您之後要續會可再查詢。");
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content flex-col w-full max-w-lg mx-auto">
        <div className="card w-full shadow-xl bg-base-100">
          <div className="card-body space-y-4">
            <h1 className="text-2xl font-bold text-center">會員續費</h1>

            <div className="text-sm text-gray-700 leading-7">
              <p className="text-center font-bold">🔸社團法人無極天王宮道教協會🔸</p>
              <p className="mt-3">
                感恩各位善信大德與會員長年來的護持與支持,
                <br />
                使本協會得以持續為廣大善信服務,弘揚正信道教。
              </p>
              <p className="mt-3">
                本協會目前持續招募會員中,
                <br />
                亦誠摯懇請舊會員繼續護持,共同成就道場建立,
                <br />
                宣揚無極天王弘法濟世之精神,普濟人間。
              </p>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">身分證</span>
              </label>
              <input
                type="text"
                placeholder="請輸入身分證"
                value={idCard}
                onChange={(e) => setIdCard(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <button
              onClick={() => void handleCheck()}
              className="w-full px-6 py-3 rounded-lg text-white bg-[#C299FF] hover:opacity-90 text-lg font-bold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "查詢中..." : "查詢會籍"}
            </button>

            {error && <p className="text-red-500 text-center">{error}</p>}
            {info && <p className="text-center text-gray-700">{info}</p>}

            {checked && membership && (
              <div className="card bg-base-200/60 shadow-inner">
                <div className="card-body space-y-3">
                  <p className="text-center font-bold">會籍資訊</p>

                  <div className="mx-auto w-full max-w-[320px] space-y-2 text-sm text-gray-800">
                    <div className="flex items-baseline justify-center gap-2">
                      <div className="w-[96px] text-right font-bold">姓名</div>
                      <div className="w-[12px] text-center">：</div>
                      <div className="flex-1 text-left">{memberName ?? "-"}</div>
                    </div>

                    <div className="flex items-baseline justify-center gap-2">
                      <div className="w-[96px] text-right font-bold">身分證</div>
                      <div className="w-[12px] text-center">：</div>
                      <div className="flex-1 text-left">{membership.id_card}</div>
                    </div>

                    <div className="flex items-baseline justify-center gap-2">
                      <div className="w-[96px] text-right font-bold">生效日</div>
                      <div className="w-[12px] text-center">：</div>
                      <div className="flex-1 text-left">{membership.effective_from}</div>
                    </div>

                    <div className="flex items-baseline justify-center gap-2">
                      <div className="w-[96px] text-right font-bold">到期日</div>
                      <div className="w-[12px] text-center">：</div>
                      <div className="flex-1 text-left">{membership.expires_on}</div>
                    </div>

                    <div className="flex items-baseline justify-center gap-2">
                      <div className="w-[96px] text-right font-bold">下次應繳日</div>
                      <div className="w-[12px] text-center">：</div>
                      <div className="flex-1 text-left">{membership.next_due_on}</div>
                    </div>
                  </div>

                  {pending ? (
                    <div className="text-center font-bold text-gray-800">
                      已送出續會申請，待管理員確認。
                    </div>
                  ) : declined ? null : (
                    <>
                      <p className="text-center text-lg mt-2">您是否要續會？</p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => void handleRenewYes()}
                          className="flex-1 max-w-[140px] px-8 py-3 rounded-lg text-white bg-[#32C8C2] hover:opacity-90 text-lg font-bold disabled:opacity-60"
                          disabled={loading}
                        >
                          是
                        </button>
                        <button
                          onClick={() => void handleRenewNo()}
                          className="flex-1 max-w-[140px] px-8 py-3 rounded-lg text-white bg-[#E65C52] hover:opacity-90 text-lg font-bold"
                        >
                          否
                        </button>
                      </div>
                    </>
                  )}

                  {!pending && showPayment && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="font-bold text-gray-800">◆ 會員繳費方式</p>
                        <div className="inline-flex items-center mt-2 px-3 py-1 rounded bg-success/10 text-success font-bold">
                          轉帳
                        </div>
                        <div className="mt-2 text-sm text-gray-800 leading-6">
                          <div>戶名：無極天王宮道教協會</div>
                          <div>郵局代號：700</div>
                          <div>郵局帳號：0031620-0136581</div>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-gray-800">◆ 會費繳納方式</p>
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

                        <button
                          type="button"
                          className="w-full mt-4 px-6 py-3 rounded-lg text-white bg-[#C299FF] hover:opacity-90 text-lg font-bold disabled:opacity-60"
                          onClick={() => void handleSubmitRenewal()}
                          disabled={loading}
                        >
                          {loading ? "送出中..." : "送出續會申請"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!needReminder ? null : (
                    <p className="text-xs text-center text-gray-500">
                      提醒：目前會籍已逾期，若需續費請回覆「是」。
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
