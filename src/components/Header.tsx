"use client";

import { useUserStore } from "@/store/use-user-store";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Header() {
  const { user } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            SportsMate
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/"
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              홈
            </Link>
            <div className="relative group h-full flex items-center">
              <Link
                href="/schedule"
                className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors py-4"
              >
                경기일정
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 top-10 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-2 min-w-[140px] flex flex-col gap-1">
                  <Link
                    href="/schedule?sport=VOLLEYBALL"
                    className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg hover:text-blue-600 font-bold flex items-center gap-2"
                  >
                    <span>🏐</span> 배구
                  </Link>
                  <Link
                    href="/schedule?sport=BASKETBALL"
                    className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg hover:text-orange-600 font-bold flex items-center gap-2"
                  >
                    <span>🏀</span> 농구
                  </Link>
                </div>
              </div>
            </div>
            <Link
              href="/rooms"
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              직관 동행
            </Link>
            <Link
              href="/profile"
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              직관 인증
            </Link>
          </nav>
        </div>

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
