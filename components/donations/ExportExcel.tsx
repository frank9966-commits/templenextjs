"use client";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export interface Donation {
  id: number;
  participant_id?: number;
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
  } | null;
}

interface ExportExcelProps {
  data: Donation[];
  filename: string;
}

export default function ExportExcel({ data, filename }: ExportExcelProps) {
  const exportToExcel = () => {
    const exportData = data.map((item) => ({
      身分證: item.participants?.id_card || "-",
      姓名: item.participants?.name || "-",
      生辰: item.participants?.birthday || "-",
      地址: item.participants?.address || "-",
      活動名稱: item.donations_events?.title || "-",
      捐款金額: item.donation_amount || 0,
      捐款時間: new Date(item.created_at).toLocaleString(),
      備註: item.donations_memo || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "捐款資料");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, filename);
  };

  return (
    <button className="btn btn-primary btn-sm" onClick={exportToExcel}>
      匯出 Excel
    </button>
  );
}
