"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      username: formData.get("username"),
      password: formData.get("password"),
    });

    if (res?.error) {
      setError("登入失敗");
    } else {
      router.push("/admin/menu"); // 登入成功後跳轉到選擇頁面
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl">
        <div className="card-body px-6 py-8">
          <h2 className="text-2xl font-bold text-center">管理員登入</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <input
                type="text"
                name="username"
                placeholder="使用者名稱"
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control">
              <input
                type="password"
                name="password"
                placeholder="密碼"
                className="input input-bordered w-full"
              />
            </div>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary w-full">
                登入
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
