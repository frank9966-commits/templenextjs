import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabaseClient"; // 確保這個路徑正確

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        id_card: { label: "身分證", type: "text", placeholder: "輸入身分證" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.id_card || !credentials?.password) {
          return null;
        }

        // 查詢 Supabase 取得使用者
        const { data: user, error } = await supabase
          .from("participants") // 假設你的帳號密碼存在這個表
          .select("*")
          .eq("id_card", credentials.id_card)
          .single();

        if (error || !user) {
          throw null;
        }

        // ✅ 直接比對密碼，不加密
        if (credentials.password !== user.password) {
          throw null;
        }

        // ✅ 只有 `role` 是 `admin` 的使用者可以登入
        if (user.role !== "admin") {
          return null; // 這裡一樣 return null
        }

        return {
          id: user.id_card, // 這裡回傳 id_card 作為使用者 ID
          name: user.name,
          role: user.role, // 如果有 role 欄位，可以存取
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role; // 把 role 存到 token
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role; // 把 role 放到 session
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
