"use client";

import { StoreInitializer } from "@/components/auth/StoreInitializer";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreInitializer />
      {children}
    </SessionProvider>
  );
}
