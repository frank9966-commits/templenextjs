"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ExportExcel from "@/components/ExportExcel"; // ✅ 引入 Excel 匯出元件


interface Participant {
  id: number;
  id_card: string;
  name: string;
  participation_status?: string;
  address?: string;
  birthday?: string;
  created_at: string;
  updated_at: string;
  family_id?: string;
  admin_viewed: boolean;
  zodiac_sign?: string;
  event_date?: string;
  events: { title: string } | null;
  pay_status?: string;
  memo?: string;
}

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string>("");

  // 取得參與者資料
  useEffect(() => {
    async function fetchParticipants() {
      const { data, error } = await supabase
        .from("participants")
        .select("*, events(title)");

      if (error) {
        setError("取得資料失敗：" + error.message);
      } else {
        setParticipants(data as Participant[]);
      }
    }
    fetchParticipants();
  }, []);

  // ✅ 更新繳費狀態
  const updatePayStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from("participants")
      .update({ pay_status: newStatus })
      .eq("id", id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, pay_status: newStatus } : p))
      );
    } else {
      console.error("更新繳費狀態失敗：", error);
    }
  };

  // ✅ 標記為已查看 (修正錯誤)
  const markAsViewed = async (id: number) => {
    const { error } = await supabase
      .from("participants")
      .update({ admin_viewed: true }) // ✅ 更新 admin_viewed
      .eq("id", id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, admin_viewed: true } : p))
      );
    } else {
      console.error("標記為已查看失敗：", error);
    }
  };

  // 刪除參與者
  const deleteParticipant = async (id: number) => {
    if (confirm("您確定要刪除此參與者嗎？")) {
      const { error } = await supabase
        .from("participants")
        .delete()
        .eq("id", id);

      if (!error) {
        // 從狀態中移除被刪除的參與者
        setParticipants((prev) => prev.filter((p) => p.id !== id));
      } else {
        console.error("刪除參與者失敗：", error);
      }
    }
  };


  return (
    <div className="w-full mx-auto p-4">
      {error && <p className="text-red-500 text-center">{error}</p>}
      <div className="text-right mb-4">
        <ExportExcel data={participants} filename="報名資料.xlsx" />
      </div>

      {/* 表格呈現資料 */}
      <div className="overflow-auto max-h-[700px]">
        <table className="table-auto w-full border-collapse border border-gray-300">
          <thead className="bg-gray-200 sticky top-0 z-20">
            <tr className="text-left">
              {[
                "姓名",
                "活動名稱",
                "身分證",
                "地址",
                "生辰",
                "生肖",
                "是否參加",
                "參加梯次",
                "關係人",
                "備註",
                "創造日期",
                "最後編輯",
                "繳費狀態",
                "管理",
              ].map((header) => (
                <th key={header} className="border border-gray-300 p-2">
                  {header}
                </th>
              ))}
              <th className="border border-gray-300 p-2">刪除</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => {
              const isEdited =
                new Date(p.created_at).getTime() !==
                new Date(p.updated_at).getTime();
              const hasChanges =
                isEdited ||
                (p.participation_status && p.participation_status !== "none");
              const highlight =
                !p.admin_viewed && hasChanges ? "bg-yellow-100" : "";

              return (
                <tr key={p.id} className={`${highlight} border border-gray-300`}>
                  <td className="border border-gray-300 p-2 font-bold">{p.name}</td>
                  <td className="border border-gray-300 p-2">
                    {p.events ? p.events.title : "-"}
                  </td>
                  <td className="border border-gray-300 p-2">{p.id_card}</td>
                  <td className="border border-gray-300 p-2">{p.address || "-"}</td>
                  <td className="border border-gray-300 p-2">{p.birthday || "-"}</td>
                  <td className="border border-gray-300 p-2">{p.zodiac_sign || "-"}</td>
                  <td className="border border-gray-300 p-2">
                    {p.participation_status === "join" ? (
                      <span className="text-green-600 font-semibold">參加</span>
                    ) : (
                      <span className="text-red-600 font-semibold">不參加</span>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2">{p.event_date || "-"}</td>
                  <td className="border border-gray-300 p-2">{p.family_id || "-"}</td>
                  <td className="border border-gray-300 p-2">{p.memo || "-"}</td>
                  <td className="border border-gray-300 p-2">
                    {new Date(p.created_at).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(p.updated_at).toLocaleString()}
                  </td>

                  {/* ✅ 繳費狀態，下拉選單切換 */}
                  <td className="border border-gray-300 p-2">
                    <select
                      className="border p-1 rounded"
                      value={p.pay_status || "未繳交"} // 預設值
                      onChange={(e) => updatePayStatus(p.id, e.target.value)}
                    >
                      <option value="已繳交">已繳交</option>
                      <option value="未繳交">未繳交</option>
                    </select>
                  </td>

                  {/* ✅ 修正「標記已查看」按鈕邏輯 */}
                  <td className="border border-gray-300 p-2">
                    {!p.admin_viewed && hasChanges && (
                      <button
                        onClick={() => markAsViewed(p.id)} // ✅ 改成正確的函式
                        className="btn btn-warning w-full text-sm px-2 py-1"
                      >
                        標記已查看
                      </button>
                    )}
                  </td>
                  {/* 刪除 */}
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => deleteParticipant(p.id)}
                      className="btn btn-danger w-full text-sm px-2 py-1"
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
