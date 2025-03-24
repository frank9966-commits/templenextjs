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
            className="w-full px-6 py-3 rounded-lg text-white text-lg font-bold bg-[#F5B748] hover:opacity-90"
          >
            新增活動標題
          </button>
          <button
            onClick={() => router.push("/admin/dashboard")}
            className="w-full px-6 py-3 mb-3 rounded-lg text-white text-lg font-bold bg-[#d3c241] hover:opacity-90"
          >
            查看活動報名狀況
          </button>

          <button
            onClick={() => router.push("/admin/donations-events")}
            className="w-full px-6 py-3 mb-3 rounded-lg text-white text-lg font-bold bg-[#56A8C8] hover:opacity-90"
          >
            新增捐款活動
          </button>

          <button
            onClick={() => router.push("/admin/donation")}
            className="w-full px-6 py-3 mb-3 rounded-lg text-white text-lg font-bold bg-[#8FD3D1] hover:opacity-90"
          >
            查看捐款狀況
          </button>

        </div>
      </div>
    </div>
  );
}
