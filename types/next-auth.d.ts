import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      id_card: string; // 新增 `id_card`
      role: string; // 新增 `role`
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    id_card: string; // 新增 `id_card`
    role: string; // 新增 `role`
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    id_card: string; // 新增 `id_card`
    role: string; // 新增 `role`
  }
}
