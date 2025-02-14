"use client";
import * as XLSX from "xlsx";

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
  events: { title: string } | null;
  pay_status?: string;
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

    const worksheetData = data.map((p) => ({
      姓名: p.name,
      活動名稱: p.events ? p.events.title : "-",
      身分證: p.id_card,
      地址: p.address || "-",
      生辰: p.birthday || "-",
      生肖: p.zodiac_sign || "-",
      是否參加: p.participation_status === "join" ? "參加" : "不參加",
      關係人: p.family_id || "-",
      創造日期: new Date(p.created_at).toLocaleString(),
      最後編輯: new Date(p.updated_at).toLocaleString(),
      繳費狀態: p.pay_status || "未繳交",
      已查看: p.admin_viewed ? "已查看" : "未查看",
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "報名資料");

    // 下載 Excel 檔案
    XLSX.writeFile(workbook, filename);
  };

  return (
    <button onClick={exportToExcel} className="btn btn-success">
      匯出 Excel
    </button>
  );
}
