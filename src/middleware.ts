import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // 보호할 경로 패턴 지정
  matcher: [
    "/profile/:path*",
    "/rooms/create",
    // "/rooms/:path*" // 상세 페이지도 보호할지 여부는 기획에 따라 결정 (일단 생성과 프로필만 보호)
  ],
};
