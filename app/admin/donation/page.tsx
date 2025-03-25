"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ExportExcel from "../../../components/donations/ExportExcel";

interface Donation {
  id: number;
  participant_id?: number;
  event_id?: number;
  donation_amount?: number;
  created_at: string;
  donations_memo?: string;
  participants: {
    name: string;
    id_card: string;
    birthday: string;
    address: string;
  } | null;
  donations_events?: {
    title: string;
    id: number;
    total_amount: number;
  } | null;
}

export default function DonationDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [error, setError] = useState<string>("");

  // 取得捐款資料
  useEffect(() => {
    async function fetchDonations() {
      const { data, error } = await supabase
        .from("donations")
        .select(`
          *,
          participants(name, id_card, birthday, address),
          donations_events(id, title, total_amount)
        `);


      if (error) {
        setError("取得捐款資料失敗：" + error.message);
      } else {
        setDonations(data as Donation[]);
      }
      console.log(data);
    }
    fetchDonations();
  }, []);

  // 刪除捐款紀錄
  const deleteDonation = async (id: number) => {
    const donation = donations.find((d) => d.id === id);

    if (!donation) {
      alert("找不到該筆捐款資料");
      return;
    }

    const eventId = donation?.event_id || null;
    const donationAmount = donation.donation_amount || 0;

    if (!eventId) {
      alert("找不到對應的活動 ID，無法加回金額");
      return;
    }

    if (confirm(`確定要刪除捐款者「${donation.participants?.name ?? "未知"}」的捐款資料嗎？`)) {
      // 1️⃣：先更新 donations_events 的 total_amount 金額
      const { error: updateError } = await supabase.rpc("add_amount", {
        event_id_input: eventId,
        amount_input: Number(donationAmount), // 👈 這裡要確保是數字
      });

      if (updateError) {
        alert("加回金額失敗：" + updateError.message);
        return;
      }

      // 2️⃣：再刪除這筆資料
      const { error: deleteError } = await supabase.from("donations").delete().eq("id", id);

      if (!deleteError) {
        setDonations((prev) => prev.filter((d) => d.id !== id));
        alert("成功刪除捐款資料並加回金額！");
      } else {
        alert("刪除失敗：" + deleteError.message);
      }
    }
  };



  const headers = [
    "身分證",
    "姓名",
    "生辰",
    "地址",
    "活動名稱",
    "捐款金額",
    "捐款時間",
    "備註",
  ];

  return (
    <div className="w-full mx-auto p-4 bg-base-200">
      <div className="text-right mb-4">
        <ExportExcel data={donations} filename="捐款資料.xlsx" />
      </div>
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* <div className="text-right mb-4">
        <ExportExcel data={donations} filename="捐款資料.xlsx" />
      </div> */}

      <div className="overflow-x-auto max-h-[700px]">
        <table className="min-w-[1200px] table-auto border-collapse border border-gray-300">
          <thead className="bg-gray-200 sticky top-0 z-20">
            <tr className="text-left dark:bg-gray-800 text-white">
              <th className="border border-gray-300 p-2">刪除</th>
              {headers.map((h) => (
                <th key={h} className="border border-gray-300 p-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {donations.map((d) => (
              <tr key={d.id} className="border border-gray-300">
                <td className="border border-gray-300 p-2">
                  <button
                    onClick={() => deleteDonation(d.id)}
                    className="btn btn-error btn-sm"
                  >
                    刪除
                  </button>
                </td>
                <td className="border border-gray-300 p-2">{d.participants?.id_card || "-"}</td>
                <td className="border border-gray-300 p-2">{d.participants?.name || "-"}</td>
                <td className="border border-gray-300 p-2">{d.participants?.birthday || "-"}</td>
                <td className="border border-gray-300 p-2">{d.participants?.address || "-"}</td>
                <td className="border border-gray-300 p-2">
                  {d.donations_events?.title || "-"}
                </td>
                <td className="border border-gray-300 p-2">{d.donation_amount}</td>
                <td className="border border-gray-300 p-2">
                  {new Date(d.created_at).toLocaleString()}
                </td>
                <td className="border border-gray-300 p-2">{d.donations_memo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
