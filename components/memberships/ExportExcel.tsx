"use client";

import * as XLSX from "xlsx";

export type MembershipExportRow = {
  姓名: string;
  身分證: string;
  生效日: string;
  到期日: string;
  應繳日: string;
  提醒起算日: string;
  需要提醒: string;
  繳費狀態: string;
  繳費方式: string;
  續會期間: string;
  最後確認收款: string;
};

interface ExportExcelProps {
  data: MembershipExportRow[];
  filename?: string;
}

export default function ExportExcel({ data, filename = "會籍清單.xlsx" }: ExportExcelProps) {
  const exportToExcel = () => {
    if (!data || data.length === 0) {
      alert("沒有可匯出的資料！");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "會籍清單");
    XLSX.writeFile(workbook, filename);
  };

  return (
    <button className="btn btn-success btn-sm" onClick={exportToExcel}>
      匯出 Excel
    </button>
  );
}
