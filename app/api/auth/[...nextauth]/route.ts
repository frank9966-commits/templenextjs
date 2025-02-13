import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabaseClient";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        id_card: { label: "身分證號", type: "text", placeholder: "A123456789" },
        password: { label: "密碼", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.id_card || !credentials?.password) {
          return null;
        }

        // 取得 `participants` 資料，並檢查使用者是否存在
        const { data: userData, error } = await supabase
          .from("participants")
          .select("id, id_card, role, password") // 多撈一點欄位
          .eq("id_card", credentials.id_card)
          .maybeSingle(); // 用 maybeSingle()，找不到時 data 會是 null，不會直接 throw error

        console.log("userData =>", userData);
        console.log("error =>", error);

        if (error) {
          console.error("資料庫查詢發生錯誤", error);
          return null;
        }
        if (!userData) {
          console.log("找不到使用者，請檢查 id_card 是否正確");
          return null;
        }
        if (userData.role !== "admin") {
          console.log("權限不足");
          return null;
        }
        if (credentials.password !== userData.password) {
          console.log("密碼錯誤");
          return null;
        }

        return {
          id: userData.id.toString(),
          id_card: userData.id_card,
          role: userData.role,
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
        token.id = user.id;
        token.id_card = user.id_card; // 傳遞 `id_card`
        token.role = user.role; // 傳遞 `role`
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          id_card: token.id_card, // 傳遞 `id_card`
          role: token.role, // 傳遞 `role`
          name: session.user?.name || "",
        };
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
