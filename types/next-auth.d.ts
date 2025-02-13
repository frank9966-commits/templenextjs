import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string; // 告訴 TypeScript `role` 存在
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: string; // 告訴 TypeScript `role` 存在
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    role: string; // 確保 `jwt` 內也有 `role`
  }
}
