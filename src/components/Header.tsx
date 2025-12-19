"use client";

import { useUserStore } from "@/store/use-user-store";
import { Award, Calendar, Home, LogIn, LogOut, LucideIcon, Menu, UserCircle, Users, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NavItem = ({
  href,
  icon: Icon,
  label,
  exact = false,
  pathname,
  onClick,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  pathname: string | null;
  onClick?: () => void;
}) => {
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");
  const active = exact ? pathname === href : isActive(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-200 group
        ${
          active
            ? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
        }
      `}
    >
      <Icon
        className={`w-5 h-5 ${
          active ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500"
        }`}
      />
      <span>{label}</span>
    </Link>
  );
};

const NavDropdown = ({
  icon: Icon,
  label,
  items,
  pathname,
}: {
  icon: LucideIcon;
  label: string;
  items: { label: string; href: string }[];
  pathname: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = items.some((item) => pathname?.includes(item.href));

  return (
    <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all duration-200
          ${
            isActive
              ? "bg-blue-50/80 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800"
          }
        `}
      >
        <Icon
          className={`w-5 h-5 ${
            isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 group-hover:text-zinc-600"
          }`}
        />
        <span>{label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute top-full left-0 pt-2 w-40 transition-all duration-200 z-[110]
          ${isOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"}
        `}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200/50 dark:border-zinc-800/50 py-2 overflow-hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 text-sm font-bold transition-colors
                ${
                  pathname?.includes(item.href)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }
              `}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Header() {
  const { user } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    if (isMobileMenuOpen) {
      const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
      return () => clearTimeout(timer);
    }
  }, [pathname, isMobileMenuOpen]);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");

  return (
    <>
      <header className="sticky top-0 z-[999] w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            <span>SportsMate</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <NavItem href="/" icon={Home} label="홈" exact pathname={pathname} />
            <NavDropdown
              icon={Calendar}
              label="경기일정"
              pathname={pathname}
              items={[
                { label: "🏐 배구 일정", href: "/schedule?sport=VOLLEYBALL" },
                { label: "🏀 농구 일정", href: "/schedule?sport=BASKETBALL" },
              ]}
            />
            <NavItem href="/rooms" icon={Users} label="직관동행" pathname={pathname} />
            <NavItem href="/certification" icon={Award} label="직관인증" pathname={pathname} />
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && user ? (
              <>
                <Link
                  href="/profile"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all
                    ${
                      isActive("/profile")
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    }
                  `}
                >
                  <UserCircle className="w-5 h-5" />
                  <span>마이페이지</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                로그인
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer relative z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-white dark:bg-zinc-950 md:hidden pt-20 px-6 animate-in slide-in-from-top-10 duration-200 overflow-y-auto">
          <nav className="flex flex-col gap-2 pb-10">
            <NavItem
              href="/"
              icon={Home}
              label="홈"
              exact
              pathname={pathname}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
            <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Match Schedule
            </div>
            <NavItem
              href="/schedule?sport=VOLLEYBALL"
              icon={Calendar}
              label="🏐 배구 일정"
              pathname={pathname}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              href="/schedule?sport=BASKETBALL"
              icon={Calendar}
              label="🏀 농구 일정"
              pathname={pathname}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
            <NavItem
              href="/rooms"
              icon={Users}
              label="직관동행"
              pathname={pathname}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <NavItem
              href="/certification"
              icon={Award}
              label="직관인증"
              pathname={pathname}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-2" />

            {mounted && user ? (
              <>
                <NavItem
                  href="/profile"
                  icon={UserCircle}
                  label="마이페이지"
                  pathname={pathname}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full text-left"
                >
                  <LogOut className="w-5 h-5" />
                  <span>로그아웃</span>
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-4 py-3 text-white bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span>로그인</span>
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
