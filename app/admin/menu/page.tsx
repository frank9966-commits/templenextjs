"use client";
import { useRouter } from "next/navigation";

export default function AdminMenu() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl p-6 text-center">
        <h1 className="text-2xl font-bold mb-6">管理選單</h1>
        <div className="space-y-4">
          <button
            onClick={() => router.push("/admin/edit-event")}
            className="btn btn-primary w-full"
          >
            新增活動標題
          </button>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="btn btn-secondary w-full"
          >
            查看報名狀況
          </button>
          <button
            onClick={() => router.push("/admin/donations-events")}
            className="btn btn-primary w-full"
          >
            新增捐款活動
          </button>
        </div>
      </div>
    </div>
  );
}
