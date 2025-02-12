"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await signIn("credentials", { redirect: false, username: formData.get("username"), password: formData.get("password") });
    if (res?.error) setError("登入失敗");
    else window.location.href = "/admin/dashboard";
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold text-center">管理員登入</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        <input type="text" name="username" placeholder="使用者名稱" className="input input-bordered w-full" />
        <input type="password" name="password" placeholder="密碼" className="input input-bordered w-full" />
        <button type="submit" className="btn btn-primary w-full">登入</button>
      </form>
      {error && <p className="text-red-500 text-center">{error}</p>}
    </div>
  );
}
