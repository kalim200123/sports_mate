"use client";

import { signOut } from "next-auth/react";

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
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
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
            {/* Smart Schedule Link & Dropdown */}
            <div className="relative group h-full flex items-center">
              <Link
                href={user?.my_team?.includes("(농구)") ? "/schedule?sport=BASKETBALL" : "/schedule?sport=VOLLEYBALL"}
                className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors h-full flex items-center"
              >
                경기일정
              </Link>

              {/* Dropdown */}
              <div className="absolute top-[90%] left-1/2 -translate-x-1/2 w-32 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden py-1">
                  <Link
                    href="/schedule?sport=VOLLEYBALL"
                    className="block px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-blue-600 dark:hover:text-blue-400 font-medium whitespace-nowrap"
                  >
                    🏐 배구
                  </Link>
                  <Link
                    href="/schedule?sport=BASKETBALL"
                    className="block px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-orange-600 dark:hover:text-orange-400 font-medium whitespace-nowrap"
                  >
                    🏀 농구
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
              href="/certification"
              className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              직관 인증
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {mounted && user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/profile"
                className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                마이페이지
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-sm font-medium text-zinc-400 hover:text-red-500 transition-colors"
              >
                로그아웃
              </button>
            </div>
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
