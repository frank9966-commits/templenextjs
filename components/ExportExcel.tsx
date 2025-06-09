"use client";
import * as XLSX from "xlsx";

interface Participant {
  id: number;
  id_card: string;
  name: string;
  sex?: string;
  participation_status?: string;
  address?: string;
  birthday?: string;
  created_at: string;
  updated_at: string;
  family_id?: string;
  admin_viewed: boolean;
  zodiac_sign?: string;
  events: { title: string } | null;
  pay_status?: string;
  event_date?: string;
  memo?: string;
  agency_name?: string;
}

interface ExportExcelProps {
  data: Participant[];
  filename?: string;
}

export default function ExportExcel({ data, filename = "報名資料.xlsx" }: ExportExcelProps) {
  const exportToExcel = () => {
    if (data.length === 0) {
      alert("沒有可匯出的資料！");
      return;
    }

    // ✅ 依 family_id（關係人）排序
    const sortedData = [...data].sort((a, b) => {
      const fa = a.family_id ?? "";
      const fb = b.family_id ?? "";
      return fa.localeCompare(fb);
    });

    const worksheetData = sortedData.map((p) => ({
      姓名: p.name,
      性別: p.sex,
      活動名稱: p.events ? p.events.title : "-",
      身分證: p.id_card,
      地址: p.address || "-",
      生辰: p.birthday || "-",
      生肖: p.zodiac_sign || "-",
      是否參加: p.participation_status === "join"
        ? "參加"
        : p.participation_status === "agent"
          ? "代辦"
          : "不參加",
      代辦者姓名: p.agency_name || "-",
      關係人: p.family_id || "-",
      參加梯次: p.family_id || "-",
      備註: p.memo || "-",
      創造日期: new Date(p.created_at).toLocaleString(),
      最後編輯: new Date(p.updated_at).toLocaleString(),
      繳費狀態: p.pay_status || "未繳交",
      已查看: p.admin_viewed ? "已查看" : "未查看",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "報名資料");

    XLSX.writeFile(workbook, filename);
  };

  return (
    <button onClick={exportToExcel} className="btn btn-success">
      匯出 Excel
    </button>
  );
}
