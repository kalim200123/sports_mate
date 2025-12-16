"use client";

import { useUserStore } from "@/store/use-user-store";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const { user } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          SportsMate
        </Link>
        <div className="flex items-center gap-4">
          {mounted && user ? (
            <Link
              href="/profile"
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              마이페이지
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
