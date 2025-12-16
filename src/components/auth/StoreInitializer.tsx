"use client";

import { useUserStore } from "@/store/use-user-store";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function StoreInitializer() {
  const { data: session } = useSession();
  const { user, setUser } = useUserStore();

  useEffect(() => {
    if (session?.user && !user) {
      // 1. Fetch full profile if not in store
      fetch("/api/users/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setUser(data);
          }
        })
        .catch((err) => console.error("Failed to init store:", err));
    }
  }, [session, user, setUser]);

  return null;
}
