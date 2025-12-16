import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // DB ID 추가
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
