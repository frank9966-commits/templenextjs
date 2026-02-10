import Link from "next/link";

export default function MembershipAreaPage() {
  return (
    <div className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content flex-col w-full max-w-lg mx-auto">
        <div className="card w-full shadow-xl bg-base-100">
          <div className="card-body space-y-4">
            <h1 className="text-2xl font-bold text-center">會員專區</h1>

            <div className="flex flex-col gap-4">
              <Link
                href="/membership/join"
                className="w-full px-6 py-3 rounded-lg text-white bg-[#E6A23C] hover:opacity-90 text-lg font-bold text-center"
              >
                首次入會
              </Link>
              <Link
                href="/membership/renew"
                className="w-full px-6 py-3 rounded-lg text-white bg-[#C299FF] hover:opacity-90 text-lg font-bold text-center"
              >
                會員續費
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center">
              入會流程說明： 填寫資料 → 提交申請 → 管理員人工審核 → 開通正式會籍。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

