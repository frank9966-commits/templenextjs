"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ExportExcel from "@/components/ExportExcel";

interface Participant {
  id: number;
  id_card: string;
  sex?: string;
  name: string;
  password?: string;
  participation_status?: "join" | "none" | "agent";
  agency_name?: string;
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
  role?: string;
}

export default function AdminDashboard() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("");

  useEffect(() => {
    async function fetchParticipants() {
      const { data, error } = await supabase
        .from("participants")
        .select("*, events(title)")
        .order("family_id", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        setError("取得資料失敗：" + error.message);
      } else {
        setParticipants(data as Participant[]);
      }
    }
    fetchParticipants();
  }, []);

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

  const markAsViewed = async (id: number) => {
    const { error } = await supabase
      .from("participants")
      .update({ admin_viewed: true })
      .eq("id", id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, admin_viewed: true } : p))
      );
    } else {
      console.error("標記為已查看失敗：", error);
    }
  };

  const updateRole = async (id: number, newRole: string) => {
    const { error } = await supabase
      .from("participants")
      .update({ role: newRole })
      .eq("id", id);

    if (!error) {
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, role: newRole } : p))
      );
    } else {
      console.error("更新角色失敗：", error);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    setMessage("");

    const { error } = await supabase
      .from("participants")
      .update({ password: newPassword })
      .eq("id_card", selectedUser.id_card);

    if (error) {
      setMessage("密碼更新失敗：" + error.message);
    } else {
      setMessage("密碼更新成功！");
      setSelectedUser(null);
      setNewPassword("");
      setMessage("");
    }
  };

  const deleteParticipant = async (id: number, name: string) => {
    if (confirm(`您確定要刪除參與者「${name}」嗎？`)) {
      const { error } = await supabase.from("participants").delete().eq("id", id);

      if (!error) {
        setParticipants((prev) => prev.filter((p) => p.id !== id));
        alert(`成功刪除參與者「${name}」`);
      } else {
        console.error("刪除參與者失敗：", error);
        alert("刪除失敗：" + error.message);
      }
    }
  };

  const headers = [
    "姓名",
    "性別",
    "活動名稱",
    "身分證",
    "地址",
    "生辰",
    "生肖",
    "是否參加",
    "代辦者姓名",
    "參加梯次",
    "關係人",
    "備註",
    "創造日期",
    "最後編輯",
    "繳費狀態",
    "角色",
    "修改密碼",
    "管理",
  ];

  const eventOptions = Array.from(
    new Set(participants.map((p) => p.events?.title || "未指定活動"))
  );

  const groupByEvent = (data: Participant[]) => {
    const grouped: { [eventName: string]: Participant[] } = {};
    data.forEach((p) => {
      const eventName = p.events?.title || "未指定活動";
      if (!grouped[eventName]) grouped[eventName] = [];
      grouped[eventName].push(p);
    });
    return grouped;
  };

  const filteredGroups = selectedEvent
    ? { [selectedEvent]: groupByEvent(participants)[selectedEvent] || [] }
    : groupByEvent(participants);

  return (
    <div className="w-full mx-auto p-4 bg-base-200 ">
      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="flex justify-between mb-4">
        <div>
          <label className="mr-2">篩選活動：</label>
          <select
            className="select select-bordered select-sm"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="">全部活動</option>
            {eventOptions.map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>
        <ExportExcel
          data={
            selectedEvent
              ? participants.filter((p) => (p.events?.title || "未指定活動") === selectedEvent)
              : participants
          }
          filename={
            selectedEvent ? `報名資料_${selectedEvent}.xlsx` : "報名資料.xlsx"
          }
        />
      </div>

      {Object.entries(filteredGroups).map(([eventTitle, group]) => (
        <div key={eventTitle} className="mb-10 border border-base-300 rounded-lg p-2 bg-base-100">
          <h2 className="text-xl font-bold mb-2 text-gray-700">
            活動：{eventTitle}（{group.length}人）
          </h2>

          <div className="overflow-x-auto max-h-[700px]">
            <table className="min-w-[150vw] table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-200 sticky top-0 z-20">
                <tr className="text-left">
                  <th className="border border-gray-300 p-2">刪除</th>
                  {headers.map((header) => (
                    <th key={header} className="border border-gray-300 p-2">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.map((p) => {
                  const isEdited = new Date(p.created_at).getTime() !== new Date(p.updated_at).getTime();
                  const hasChanges = isEdited || (p.participation_status && p.participation_status !== "none");
                  const highlight = !p.admin_viewed && hasChanges ? "bg-yellow-100" : "";

                  return (
                    <tr key={p.id} className={`${highlight} border border-gray-300`}>
                      <td className="border border-gray-300 p-2">
                        <button
                          onClick={() => deleteParticipant(p.id, p.name)}
                          className="btn btn-error w-full text-sm px-2 py-1"
                        >
                          刪除
                        </button>
                      </td>
                      <td className="border border-gray-300 p-2 font-bold">{p.name}</td>
                      <td className="border border-gray-300 p-2 font-bold">{p.sex || "-"}</td>
                      <td className="border border-gray-300 p-2">{p.events ? p.events.title : "-"}</td>
                      <td className="border border-gray-300 p-2">{p.id_card}</td>
                      <td className="border border-gray-300 p-2">{p.address || "-"}</td>
                      <td className="border border-gray-300 p-2">{p.birthday || "-"}</td>
                      <td className="border border-gray-300 p-2">{p.zodiac_sign || "-"}</td>
                      <td className="border border-gray-300 p-2">
                        {p.participation_status === "join" ? (
                          <span className="text-green-600 font-semibold">參加</span>
                        ) : p.participation_status === "agent" ? (
                          <span className="text-orange-600 font-semibold">代辦</span>
                        ) : (
                          <span className="text-red-600 font-semibold">不參加</span>
                        )}
                      </td>
                      <td className="border border-gray-300 p-2">{p.agency_name || "-"}</td>
                      <td className="border border-gray-300 p-2">{p.event_date || "-"}</td>
                      <td className="border border-gray-300 p-2">{p.family_id || "-"}</td>
                      <td className="border border-gray-300 p-2">{p.memo || "-"}</td>
                      <td className="border border-gray-300 p-2">{new Date(p.created_at).toLocaleString()}</td>
                      <td className="border border-gray-300 p-2">{new Date(p.updated_at).toLocaleString()}</td>
                      <td className="border border-gray-300 p-2">
                        <select
                          className="border p-1 rounded"
                          value={p.pay_status || "未繳交"}
                          onChange={(e) => updatePayStatus(p.id, e.target.value)}
                        >
                          <option value="已繳交">已繳交</option>
                          <option value="未繳交">未繳交</option>
                        </select>
                      </td>
                      <td className="border border-gray-300 p-2">
                        {p.role === "admin" ? (
                          <span className="text-blue-600 font-bold">管理員</span>
                        ) : (
                          <button
                            onClick={() => updateRole(p.id, "admin")}
                            className="btn btn-sm btn-info"
                          >
                            設為管理員
                          </button>
                        )}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedUser(p)}
                        >
                          修改密碼
                        </button>
                      </td>
                      <td className="border border-gray-300 p-2">
                        {!p.admin_viewed && hasChanges && (
                          <button
                            onClick={() => markAsViewed(p.id)}
                            className="btn btn-warning w-full text-sm px-2 py-1"
                          >
                            標記已查看
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-center mb-4">
              修改密碼 - {selectedUser.name}
            </h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">新密碼</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="輸入新密碼"
              />
            </div>
            {message && <p className="text-red-500 text-center mt-2">{message}</p>}
            <div className="p-4">
              <button onClick={handleChangePassword} className="btn btn-primary my-2 w-full">
                確認修改
              </button>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary w-full">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}