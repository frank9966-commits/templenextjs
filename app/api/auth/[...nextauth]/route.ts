import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabaseClient"; // 確保這個路徑正確

// ✅ 允許 `name` 為 `string | null`
interface CustomUser extends User {
  id: string;
  name: string | null;
  role: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        id_card: { label: "身分證", type: "text", placeholder: "輸入身分證" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials): Promise<CustomUser | null> {
        if (!credentials?.id_card || !credentials?.password) {
          throw new Error("請輸入身分證與密碼");
        }

        // 查詢 Supabase 取得使用者
        const { data: user, error } = await supabase
          .from("participants") // 假設你的帳號密碼存在這個表
          .select("*")
          .eq("id_card", credentials.id_card)
          .single();

        if (error || !user) {
          throw new Error("找不到使用者");
        }

        // ✅ 直接比對密碼，不加密
        if (credentials.password !== user.password) {
          throw new Error("密碼錯誤");
        }

        return {
          id: user.id_card,
          name: user.name || null, // 確保 name 為 string | null
          role: user.role || "user",
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
        token.role = (user as CustomUser).role; // 顯式轉型
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role; // 把 role 放到 session
      return session;
    },
  },
};

// ✅ 只導出 `handler`，不要導出 `authOptions`
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
