"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import {
  computeNextRenewal,
  isReminderNeeded,
  type DateOnly,
} from "@/lib/membership";

type MembershipRow = {
  id: number;
  id_card: string;
  effective_from: DateOnly;
  expires_on: DateOnly;
  next_due_on: DateOnly;
  last_renew_requested_at: string | null;
  last_paid_confirmed_at: string | null;
};

type RenewalRow = {
  id: number;
  membership_id: number;
  period_start: DateOnly;
  period_end: DateOnly;
  requested_at: string;
  admin_status: "pending" | "paid" | "unpaid";
};

export default function MembershipReminderBanner() {
  const { data: session, status } = useSession();
  const idCard = session?.user?.id;

  const [membership, setMembership] = useState<MembershipRow | null>(null);
  const [latestRenewal, setLatestRenewal] = useState<RenewalRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shouldShow = useMemo(() => {
    if (status !== "authenticated") return false;
    if (!session?.user?.role) return false;
    return session.user.role !== "admin";
  }, [session, status]);

  const refresh = async () => {
    if (!idCard) return;
    setError(null);

    const { data: m, error: mErr } = await supabase
      .from("memberships")
      .select(
        "id, id_card, effective_from, expires_on, next_due_on, last_renew_requested_at, last_paid_confirmed_at"
      )
      .eq("id_card", idCard)
      .maybeSingle();

    if (mErr) {
      setError(mErr.message);
      setMembership(null);
      setLatestRenewal(null);
      return;
    }

    if (!m) {
      setMembership(null);
      setLatestRenewal(null);
      return;
    }

    setMembership(m as MembershipRow);

    const { data: r, error: rErr } = await supabase
      .from("membership_renewal_requests")
      .select("id, membership_id, period_start, period_end, requested_at, admin_status")
      .eq("membership_id", (m as MembershipRow).id)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rErr) {
      setError(rErr.message);
      setLatestRenewal(null);
      return;
    }

    setLatestRenewal((r as RenewalRow) ?? null);
  };

  useEffect(() => {
    if (!shouldShow) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow, idCard]);

  const handleRenew = async () => {
    if (!membership) return;

    setLoading(true);
    setError(null);

    try {
      const { periodStart, periodEnd, newExpiresOn, newNextDueOn } = computeNextRenewal({
        expiresOn: membership.expires_on,
        nextDueOn: membership.next_due_on,
      });

      // 先建立/更新續會申請（避免重複點）
      const { error: upsertErr } = await supabase
        .from("membership_renewal_requests")
        .upsert(
          {
            membership_id: membership.id,
            period_start: periodStart,
            period_end: periodEnd,
            admin_status: "pending",
          },
          { onConflict: "membership_id,period_start" }
        );

      if (upsertErr) throw upsertErr;

      const { error: updErr } = await supabase
        .from("memberships")
        .update({
          expires_on: newExpiresOn,
          next_due_on: newNextDueOn,
          last_renew_requested_at: new Date().toISOString(),
          status: "active",
        })
        .eq("id", membership.id);

      if (updErr) throw updErr;

      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "續會失敗");
    } finally {
      setLoading(false);
    }
  };

  if (!shouldShow) return null;
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-2 px-4">
        <div className="alert alert-error">
          <span>會籍提醒載入失敗：{error}</span>
        </div>
      </div>
    );
  }

  // 沒有會籍資料就不提醒（避免影響非會員）
  if (!membership) return null;

  const pending = latestRenewal?.admin_status === "pending";
  const needReminder = !pending && isReminderNeeded({ nextDueOn: membership.next_due_on });

  if (!needReminder && !pending) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-2 px-4">
      <div className="card bg-base-100 shadow">
        <div className="card-body py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm sm:text-base">
              {pending ? (
                <p className="font-bold text-gray-800">已送出續會申請，待管理員確認收款。</p>
              ) : (
                <p className="font-bold text-gray-800">您的會籍已逾期，是否要續會？</p>
              )}
              <p className="text-gray-600">
                目前到期日：{membership.expires_on}，下次應繳日：{membership.next_due_on}
              </p>
            </div>

            {!pending && (
              <button
                className="px-5 py-3 rounded-lg text-white bg-[#C299FF] hover:opacity-90 text-base font-bold disabled:opacity-60"
                onClick={handleRenew}
                disabled={loading}
              >
                {loading ? "處理中..." : "立即續會"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
