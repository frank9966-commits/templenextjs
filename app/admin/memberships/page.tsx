"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  addDays,
  addMonths,
  endOfMonth,
  formatDateOnly,
  isReminderNeeded,
  type DateOnly,
} from "@/lib/membership";
import ExportMembershipExcel, {
  type MembershipExportRow,
} from "@/components/memberships/ExportExcel";

type MembershipRow = {
  id: number;
  id_card: string;
  effective_from: DateOnly;
  expires_on: DateOnly;
  next_due_on: DateOnly;
  cycle_months: number;
  status: "active" | "inactive";
  last_renew_requested_at: string | null;
  last_paid_confirmed_at: string | null;
};

type ParticipantRow = {
  id_card: string;
  name: string;
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

type RenewalResponseRow = {
  id: number;
  membership_id: number;
  period_start: DateOnly;
  response: "renew" | "decline";
  cycle_months: number | null;
  responded_at: string;
};

export default function AdminMembershipsPage() {
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [nameByIdCard, setNameByIdCard] = useState<Record<string, string>>({});
  const [pendingRenewals, setPendingRenewals] = useState<RenewalRow[]>([]);
  const [declinedResponses, setDeclinedResponses] = useState<RenewalResponseRow[]>([]);
  const [latestRenewalByMembershipId, setLatestRenewalByMembershipId] = useState<
    Record<number, RenewalRow>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [openCandidates, setOpenCandidates] = useState<ParticipantRow[]>([]);
  const [selectedIdCard, setSelectedIdCard] = useState<string>("");
  const [effectiveFrom, setEffectiveFrom] = useState<DateOnly>(
    formatDateOnly(new Date())
  );
  const [expiresOn, setExpiresOn] = useState<DateOnly | null>(null);
  const [openMarkPaid, setOpenMarkPaid] = useState(true);
  const [openLoading, setOpenLoading] = useState(false);
  const [openMessage, setOpenMessage] = useState<string>("");

  const refresh = async () => {
    setLoading(true);
    setError("");

    const { data: ms, error: msErr } = await supabase
      .from("memberships")
      .select(
        "id, id_card, effective_from, expires_on, next_due_on, cycle_months, status, last_renew_requested_at, last_paid_confirmed_at"
      )
      .order("next_due_on", { ascending: true });

    if (msErr) {
      setError(msErr.message);
      setLoading(false);
      return;
    }

    const membershipRows = (ms as MembershipRow[]) ?? [];
    setMemberships(membershipRows);

    // 開通會籍候選：participants 中「尚未有 active 會籍」的人
    {
      const { data: aps, error: allErr } = await supabase
        .from("participants")
        .select("id_card, name")
        .order("created_at", { ascending: false });

      if (!allErr && aps) {
        const all = aps as ParticipantRow[];
        const activeMembershipIdCardSet = new Set(
          membershipRows.filter((m) => m.status === "active").map((m) => m.id_card)
        );
        const candidates = all
          .filter((p) => !activeMembershipIdCardSet.has(p.id_card))
          .filter((p) => (p.id_card ?? "").trim().length > 0);
        setOpenCandidates(candidates);
        // 若目前選到的已不在候選清單，清空
        if (selectedIdCard && !candidates.some((c) => c.id_card === selectedIdCard)) {
          setSelectedIdCard("");
        }
      }
    }

    const idCards = Array.from(new Set(membershipRows.map((m) => m.id_card)));
    if (idCards.length > 0) {
      const { data: ps, error: pErr } = await supabase
        .from("participants")
        .select("id_card, name")
        .in("id_card", idCards);

      if (!pErr && ps) {
        const map: Record<string, string> = {};
        (ps as ParticipantRow[]).forEach((p) => {
          map[p.id_card] = p.name;
        });
        setNameByIdCard(map);
      }
    }

    const { data: prs, error: prErr } = await supabase
      .from("membership_renewal_requests")
      .select(
        "id, membership_id, period_start, period_end, cycle_months, requested_at, admin_status"
      )
      .eq("admin_status", "pending")
      .order("requested_at", { ascending: false });

    if (prErr) {
      setError(prErr.message);
      setPendingRenewals([]);
      setLoading(false);
      return;
    }

    setPendingRenewals((prs as RenewalRow[]) ?? []);

    // 取得每位會員最新一筆續會申請狀態（用於會籍清單顯示已繳/未繳/待審核）
    {
      const { data: allReqs, error: allReqsErr } = await supabase
        .from("membership_renewal_requests")
        .select(
          "id, membership_id, period_start, period_end, cycle_months, requested_at, admin_status"
        )
        .order("requested_at", { ascending: false })
        .limit(5000);

      if (allReqsErr) {
        setError(allReqsErr.message);
        setLatestRenewalByMembershipId({});
        setLoading(false);
        return;
      }

      const map: Record<number, RenewalRow> = {};
      (allReqs as RenewalRow[] | null)?.forEach((r) => {
        if (!map[r.membership_id]) map[r.membership_id] = r;
      });
      setLatestRenewalByMembershipId(map);
    }

    const { data: drs, error: drErr } = await supabase
      .from("membership_renewal_responses")
      .select("id, membership_id, period_start, response, cycle_months, responded_at")
      .eq("response", "decline")
      .order("responded_at", { ascending: false })
      .limit(200);

    if (drErr) {
      setError(drErr.message);
      setDeclinedResponses([]);
      setLoading(false);
      return;
    }

    setDeclinedResponses((drs as RenewalResponseRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const membershipById = useMemo(() => {
    const map = new Map<number, MembershipRow>();
    memberships.forEach((m) => map.set(m.id, m));
    return map;
  }, [memberships]);

  const computePeriodEndFromCycle = (start: DateOnly, months: number) =>
    endOfMonth(addMonths(start, months - 1));

  const cycleLabel = (months: number) =>
    months === 12 ? "年繳" : months === 6 ? "半年繳" : months === 3 ? "季繳" : "月繳";

  const updateRenewal = async (
    renewalId: number,
    patch: Partial<Pick<RenewalRow, "cycle_months" | "admin_status">>
  ) => {
    setError("");

    // 先抓原始資料，才能在改繳費方式時重算 period_end/會籍日期
    const { data: existing, error: exErr } = await supabase
      .from("membership_renewal_requests")
      .select("id, membership_id, period_start, period_end, cycle_months, admin_status")
      .eq("id", renewalId)
      .single();

    if (exErr || !existing) {
      setError(exErr?.message ?? "找不到續會申請")
      return;
    }

    const updatePayload: Record<string, unknown> = { ...patch };

    // 若修改繳費方式：重算該筆申請的 period_end，並同步會籍到期/應繳日（安全條件下）
    if (typeof patch.cycle_months === "number" && patch.cycle_months > 0) {
      const newPeriodEnd = endOfMonth(
        addMonths(existing.period_start as DateOnly, patch.cycle_months - 1)
      );
      updatePayload.period_end = newPeriodEnd;
    }

    if (patch.admin_status) {
      updatePayload.admin_updated_at = new Date().toISOString();
    }

    const { data: updated, error: updErr } = await supabase
      .from("membership_renewal_requests")
      .update(updatePayload)
      .eq("id", renewalId)
      .select("id, membership_id, admin_status, period_end")
      .single();

    if (updErr) {
      setError(updErr.message);
      return;
    }

    // 若是改繳費方式：只有在會籍目前仍對應舊 period_end 時，才更新會籍日期
    if (typeof patch.cycle_months === "number" && patch.cycle_months > 0) {
      const { data: mem, error: memErr } = await supabase
        .from("memberships")
        .select("id, expires_on")
        .eq("id", existing.membership_id)
        .single();

      if (!memErr && mem?.expires_on === existing.period_end) {
        const newPeriodEnd = updated?.period_end as DateOnly | undefined;
        if (newPeriodEnd) {
          await supabase
            .from("memberships")
            .update({
              expires_on: newPeriodEnd,
              next_due_on: addDays(newPeriodEnd, 1),
            })
            .eq("id", existing.membership_id);
        }
      }
    }

    if (patch.admin_status === "paid" && updated?.membership_id) {
      await supabase
        .from("memberships")
        .update({ last_paid_confirmed_at: new Date().toISOString(), status: "active" })
        .eq("id", updated.membership_id);
    }

    await refresh();
  };

  const markRenewal = async (renewalId: number, status: "paid" | "unpaid") => {
    await updateRenewal(renewalId, { admin_status: status });
  };

  const updateMembership = async (
    membershipId: number,
    patch: Partial<Pick<MembershipRow, "cycle_months" | "effective_from" | "expires_on" | "next_due_on" | "status">>
  ) => {
    setError("");
    const { error: updErr } = await supabase
      .from("memberships")
      .update(patch)
      .eq("id", membershipId);
    if (updErr) {
      setError(updErr.message);
      return;
    }
    await refresh();
  };

  const markInitialPaid = async (membershipId: number, paid: boolean) => {
    setError("");
    const { error: updErr } = await supabase
      .from("memberships")
      .update({
        last_paid_confirmed_at: paid ? new Date().toISOString() : null,
        ...(paid ? { status: "active" as const } : {}),
      })
      .eq("id", membershipId);

    if (updErr) {
      setError(updErr.message);
      return;
    }
    await refresh();
  };

  const handleOpenMembership = async () => {
    setError("");
    setOpenMessage("");

    const idCard = (selectedIdCard || "").trim().toUpperCase();
    if (!idCard) {
      setOpenMessage("請先選擇會員");
      return;
    }

    setOpenLoading(true);
    try {
      // 確認 participant 存在
      const { data: p, error: pErr } = await supabase
        .from("participants")
        .select("id_card")
        .eq("id_card", idCard)
        .maybeSingle();

      if (pErr) throw pErr;
      if (!p) {
        setOpenMessage("查無此身分證的會員資料（participants），請先建立會員。");
        return;
      }

      // 若已存在會籍：更新並啟用（避免 unique(id_card) 衝突；也方便重新啟用）
      const { data: existing, error: exErr } = await supabase
        .from("memberships")
        .select("id, status")
        .eq("id_card", idCard)
        .maybeSingle();

      if (exErr) throw exErr;
      const finalExpiresOn = expiresOn ?? endOfMonth(effectiveFrom);
      const nextDueOn = addDays(finalExpiresOn, 1);
      const lastPaid = openMarkPaid ? new Date().toISOString() : null;

      if (existing) {
        const { error: updErr } = await supabase
          .from("memberships")
          .update({
            effective_from: effectiveFrom,
            expires_on: finalExpiresOn,
            next_due_on: nextDueOn,
            cycle_months: 1,
            status: "active",
            last_paid_confirmed_at: lastPaid,
          })
          .eq("id", (existing as { id: number }).id);

        if (updErr) throw updErr;
        setOpenMessage(`已更新並啟用會籍：到期日 ${finalExpiresOn}，下次應繳日 ${nextDueOn}`);
      } else {
        const { error: insErr } = await supabase.from("memberships").insert({
          id_card: idCard,
          effective_from: effectiveFrom,
          expires_on: finalExpiresOn,
          next_due_on: nextDueOn,
          cycle_months: 1,
          status: "active",
          last_paid_confirmed_at: lastPaid,
        });

        if (insErr) throw insErr;
        setOpenMessage(`開通成功：到期日 ${finalExpiresOn}，下次應繳日 ${nextDueOn}`);
      }
      setSelectedIdCard("");
      setExpiresOn(null);
      setOpenMarkPaid(true);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "開通失敗");
    } finally {
      setOpenLoading(false);
    }
  };

  const reminderRows = useMemo(() => {
    return memberships
      .map((m) => {
        const remindFrom = addMonths(m.next_due_on, 1);
        const need = isReminderNeeded({ nextDueOn: m.next_due_on });
        return { ...m, remindFrom, needReminder: need };
      })
      .sort((a, b) => {
        // 先把需要提醒的排前面
        if (a.needReminder !== b.needReminder) return a.needReminder ? -1 : 1;
        return a.next_due_on.localeCompare(b.next_due_on);
      });
  }, [memberships]);

  const exportRows = useMemo<MembershipExportRow[]>(() => {
    return reminderRows
      .filter((m) => m.status === "active")
      .map((m) => {
      const name = nameByIdCard[m.id_card] ?? "-";
      const latest = latestRenewalByMembershipId[m.id];
      const paymentStatus = latest
        ? latest.admin_status === "paid"
          ? "已繳費"
          : latest.admin_status === "unpaid"
            ? "未繳費"
            : "待審核"
        : m.last_paid_confirmed_at
          ? "已確認收款"
          : "-";
      const cycleText = cycleLabel(m.cycle_months ?? 1);
      const periodText = latest ? `${latest.period_start}~${latest.period_end}` : "-";
      const lastPaid = m.last_paid_confirmed_at
        ? new Date(m.last_paid_confirmed_at).toLocaleString()
        : "-";

      return {
        姓名: name,
        身分證: m.id_card,
        生效日: m.effective_from,
        到期日: m.expires_on,
        應繳日: m.next_due_on,
        提醒起算日: m.remindFrom,
        需要提醒: m.needReminder ? "需要" : "-",
        繳費狀態: paymentStatus,
        繳費方式: cycleText,
        續會期間: periodText,
        最後確認收款: lastPaid,
      };
      });
  }, [reminderRows, nameByIdCard, latestRenewalByMembershipId]);

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">會員繳費管理</h1>
          <div className="flex items-center gap-2">
            <ExportMembershipExcel data={exportRows} filename="會籍清單.xlsx" />
            <button className="btn btn-sm" onClick={() => void refresh()}>
              重新整理
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h2 className="text-lg font-bold mb-3">設定會員（建立/啟用會籍）</h2>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="form-control flex-1">
                <label className="label">
                  <span className="label-text">選擇人員（姓名 / 身分證）</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedIdCard}
                  onChange={(e) => setSelectedIdCard(e.target.value)}
                >
                  <option value="">請選擇人員</option>
                  {openCandidates.map((p) => (
                    <option key={p.id_card} value={p.id_card}>
                      {p.name}（{p.id_card}）
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control lg:w-56">
                <label className="label">
                  <span className="label-text">生效日</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value as DateOnly)}
                />
              </div>

              <div className="form-control lg:w-56">
                <label className="label">
                  <span className="label-text">到期日（可不填，預設月底）</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={expiresOn ?? ""}
                  onChange={(e) =>
                    setExpiresOn((e.target.value || null) as DateOnly | null)
                  }
                />
              </div>

              <div className="form-control lg:w-56">
                <label className="label">
                  <span className="label-text">收款</span>
                </label>
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={openMarkPaid}
                    onChange={(e) => setOpenMarkPaid(e.target.checked)}
                  />
                  <span className="label-text">同時標記已確認收款</span>
                </label>
              </div>

              <button
                className="btn btn-primary w-full lg:w-40"
                onClick={() => void handleOpenMembership()}
                disabled={openLoading || openCandidates.length === 0}
              >
                {openLoading ? "處理中..." : "開通"}
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              只會顯示「尚未有 active 會籍」的人員；已經是會員的人不會再出現在這裡。
            </p>

            {openMessage && (
              <div className="alert alert-info mt-3">
                <span className="text-sm">{openMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h2 className="text-lg font-bold mb-3">待審核續會申請</h2>
            {loading ? (
              <p>Loading...</p>
            ) : pendingRenewals.length === 0 ? (
              <p className="text-gray-500">目前沒有待審核申請。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>身分證</th>
                      <th>期間</th>
                      <th>繳費</th>
                      <th>申請時間</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRenewals.map((r) => {
                      const m = membershipById.get(r.membership_id);
                      const idCard = m?.id_card ?? "";
                      const name = idCard ? nameByIdCard[idCard] ?? "-" : "-";

                      return (
                        <tr key={r.id}>
                          <td>{name}</td>
                          <td>{idCard || "-"}</td>
                          <td>
                            {r.period_start} ~ {r.period_end}
                          </td>
                          <td>
                            <select
                              className="select select-bordered select-sm"
                              value={r.cycle_months}
                              onChange={(e) =>
                                void updateRenewal(r.id, {
                                  cycle_months: Number(e.target.value),
                                })
                              }
                            >
                              <option value={1}>月繳</option>
                              <option value={3}>季繳</option>
                              <option value={6}>半年繳</option>
                              <option value={12}>年繳</option>
                            </select>
                          </td>
                          <td>{new Date(r.requested_at).toLocaleString()}</td>
                          <td className="flex gap-2">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => void markRenewal(r.id, "paid")}
                            >
                              已續費
                            </button>
                            <button
                              className="btn btn-sm btn-error"
                              onClick={() => void markRenewal(r.id, "unpaid")}
                            >
                              未續費
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow mb-6">
          <div className="card-body">
            <h2 className="text-lg font-bold mb-3">已回覆不續費</h2>
            {loading ? (
              <p>Loading...</p>
            ) : declinedResponses.length === 0 ? (
              <p className="text-gray-500">目前沒有回覆不續費的紀錄。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>身分證</th>
                      <th>本期起算日</th>
                      <th>回覆時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {declinedResponses.map((r) => {
                      const m = membershipById.get(r.membership_id);
                      const idCard = m?.id_card ?? "";
                      const name = idCard ? nameByIdCard[idCard] ?? "-" : "-";
                      return (
                        <tr key={r.id}>
                          <td>{name}</td>
                          <td>{idCard || "-"}</td>
                          <td>{r.period_start}</td>
                          <td>{new Date(r.responded_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="text-lg font-bold mb-3">會籍清單（含提醒狀態）</h2>
            {loading ? (
              <p>Loading...</p>
            ) : memberships.length === 0 ? (
              <p className="text-gray-500">目前沒有會籍資料。</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>提醒</th>
                      <th>繳費狀態</th>
                      <th>狀態</th>
                      <th>姓名</th>
                      <th>身分證</th>
                      <th>生效日</th>
                      <th>到期日</th>
                      <th>應繳日</th>
                      <th>提醒起算日</th>
                      <th>調整</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderRows.map((m) => {
                      const name = nameByIdCard[m.id_card] ?? "-";
                      const latest = latestRenewalByMembershipId[m.id];
                      const paymentStatus = latest
                        ? latest.admin_status === "paid"
                          ? "已繳費"
                          : latest.admin_status === "unpaid"
                            ? "未繳費"
                            : "待審核"
                        : m.last_paid_confirmed_at
                          ? "已確認收款"
                          : "-";

                      const cycleText = latest ? cycleLabel(latest.cycle_months) : "";
                      return (
                        <tr key={m.id} className={m.needReminder ? "bg-warning/10" : ""}>
                          <td>{m.needReminder ? "需要" : "-"}</td>
                          <td>
                            <div className="font-bold">{paymentStatus}</div>
                            {latest && (
                              <div className="text-xs text-gray-500">
                                {cycleText}｜{latest.period_start}~{latest.period_end}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              <div className="text-sm font-bold">
                                {m.status === "active" ? "啟用" : "停用"}
                              </div>
                              <button
                                className={
                                  m.status === "active"
                                    ? "btn btn-xs btn-outline"
                                    : "btn btn-xs btn-primary"
                                }
                                onClick={() =>
                                  void updateMembership(m.id, {
                                    status: m.status === "active" ? "inactive" : "active",
                                  })
                                }
                              >
                                {m.status === "active" ? "停用" : "恢復"}
                              </button>
                            </div>
                          </td>
                          <td>{name}</td>
                          <td>{m.id_card}</td>
                          <td>{m.effective_from}</td>
                          <td>{m.expires_on}</td>
                          <td>{m.next_due_on}</td>
                          <td>{m.remindFrom}</td>
                          <td className="min-w-[220px]">
                            <div className="flex flex-col gap-2">
                              <select
                                className="select select-bordered select-sm"
                                value={m.cycle_months ?? 1}
                                onChange={(e) =>
                                  void (async () => {
                                    const newCycleMonths = Number(e.target.value);
                                    const latest = latestRenewalByMembershipId[m.id];

                                    // 若尚無任何續費申請（多為首次入會），改預設繳費方式時同步重算會籍期間
                                    if (!latest) {
                                      const newExpiresOn = computePeriodEndFromCycle(
                                        m.effective_from,
                                        newCycleMonths
                                      );
                                      const newNextDueOn = addDays(newExpiresOn, 1);
                                      await updateMembership(m.id, {
                                        cycle_months: newCycleMonths,
                                        expires_on: newExpiresOn,
                                        next_due_on: newNextDueOn,
                                      });
                                      return;
                                    }

                                    // 有續費申請時，這裡僅調整預設繳費方式，不主動改動現有到期日
                                    await updateMembership(m.id, {
                                      cycle_months: newCycleMonths,
                                    });
                                  })()
                                }
                              >
                                <option value={1}>月繳</option>
                                <option value={3}>季繳</option>
                                <option value={6}>半年繳</option>
                                <option value={12}>年繳</option>
                              </select>

                              {latest ? (
                                <div className="flex gap-2">
                                  <button
                                    className="btn btn-xs btn-success"
                                    onClick={() => void updateRenewal(latest.id, { admin_status: "paid" })}
                                  >
                                    已繳費
                                  </button>
                                  <button
                                    className="btn btn-xs btn-error"
                                    onClick={() => void updateRenewal(latest.id, { admin_status: "unpaid" })}
                                  >
                                    未繳費
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  <span className="text-xs text-gray-500">尚無續費申請（首次入會通常不會有）</span>
                                  {m.last_paid_confirmed_at ? (
                                    <button
                                      className="btn btn-xs btn-outline"
                                      onClick={() => void markInitialPaid(m.id, false)}
                                    >
                                      取消收款標記
                                    </button>
                                  ) : (
                                    <button
                                      className="btn btn-xs btn-success"
                                      onClick={() => void markInitialPaid(m.id, true)}
                                    >
                                      標記首次入會已收款
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
