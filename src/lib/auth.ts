import { UserService } from "@/services/user.service";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    // 개발용 Mock Login Provider
    CredentialsProvider({
      name: "Mock Login",
      credentials: {
        nickname: { label: "Nickname", type: "text", placeholder: "test_user" },
        gender: { label: "Gender", type: "text" },
        ageGroup: { label: "Age Group", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.nickname || !credentials?.gender || !credentials?.ageGroup) return null;

        try {
          // 닉네임으로 유저 조회 또는 생성
          const user = await UserService.findOrCreateMockUser(
            credentials.nickname,
            credentials.gender as "MALE" | "FEMALE",
            credentials.ageGroup
          );

          // NextAuth User 객체 반환 (id는 string이어야 함)
          return {
            id: user.id.toString(),
            name: user.nickname,
            email: user.kakao_id, // email 필드에 kakao_id 저장 (편의상)
            image: null,
          };
        } catch (error) {
          console.error("Mock Login Error:", error);
          return null;
        }
      },
    }),
    // 추후 KakaoProvider 추가 위치
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // 세션에 DB Primary Key(id) 포함
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // 커스텀 로그인 페이지
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key", // 개발용 기본 시크릿
};
