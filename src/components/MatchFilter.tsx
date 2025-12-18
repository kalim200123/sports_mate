"use client";

import { BASKETBALL_MEN_TEAMS, BASKETBALL_WOMEN_TEAMS, MEN_TEAMS, WOMEN_TEAMS } from "@/lib/constants";
import { getTeamEmblem } from "@/lib/utils";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

const MONTHS = [
  { label: "10월", value: "2025-10" },
  { label: "11월", value: "2025-11" },
  { label: "12월", value: "2025-12" },
  { label: "1월", value: "2026-01" },
  { label: "2월", value: "2026-02" },
  { label: "3월", value: "2026-03" },
  { label: "4월", value: "2026-04" },
];

export default function MatchFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [_, startTransition] = useTransition();
  /* eslint-enable @typescript-eslint/no-unused-vars */
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentGender = searchParams.get("gender") || "ALL"; // ALL | MEN | WOMEN
  const currentTeam = searchParams.get("team") || "ALL";
  const currentMonth = searchParams.get("month") || "2025-12"; // Default to Dec 2025

  const updateFilter = (updates: { [key: string]: string | null }) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset team if gender changes to ALL, or swaps
    if (updates.gender) {
      if (updates.gender === "ALL") {
        params.delete("team");
      } else {
        params.delete("team"); // Always reset team on gender switch for safety
      }
    }

    // Reset team and gender if sport changes
    if (updates.sport) {
      params.delete("team");
      params.delete("gender");
    }

    // If selecting a month, ensure date filter is cleared (as they conflict/override)
    if (updates.month) {
      params.delete("date");
    }

    startTransition(() => {
      router.replace(`?${params.toString()}`, { scroll: false });
    });
  };

  const currentSport = searchParams.get("sport") || "VOLLEYBALL"; // VOLLEYBALL | BASKETBALL

  // Determine teams to show (Only if Gender is MEN or WOMEN)
  let displayedTeams: string[] = [];
  if (currentSport === "BASKETBALL") {
    if (currentGender === "MEN") displayedTeams = BASKETBALL_MEN_TEAMS;
    else if (currentGender === "WOMEN") displayedTeams = BASKETBALL_WOMEN_TEAMS;
  } else {
    // VOLLEYBALL (Default)
    if (currentGender === "MEN") displayedTeams = MEN_TEAMS;
    else if (currentGender === "WOMEN") displayedTeams = WOMEN_TEAMS;
  }
  // If ALL, displayedTeams remains empty -> Emblems hidden

  const currentIndex = MONTHS.findIndex((m) => m.value === currentMonth);
  const handlePrevMonth = () => {
    if (currentIndex > 0) {
      updateFilter({ month: MONTHS[currentIndex - 1].value });
    }
  };
  const handleNextMonth = () => {
    if (currentIndex < MONTHS.length - 1) {
      updateFilter({ month: MONTHS[currentIndex + 1].value });
    }
  };

  // Scrolled (Compact) View Overlay
  const compactHeader =
    mounted && isScrolled
      ? createPortal(
          <div className="fixed top-0 left-0 right-0 z-[9999] bg-white dark:bg-[#121212] border-b border-zinc-200 dark:border-zinc-800 shadow-sm transition-none">
            <div className="max-w-5xl mx-auto flex items-center justify-between h-[60px] px-4">
              <div className="w-10"></div> {/* Spacer */}
              {/* Center: Month Navigation */}
              <div className="flex items-center gap-6">
                <button
                  onClick={handlePrevMonth}
                  disabled={currentIndex <= 0}
                  className="p-2 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>

                <span className="text-xl font-bold text-zinc-800 dark:text-white tabular-nums">
                  {currentMonth.replace("-", ".")}
                </span>

                <button
                  onClick={handleNextMonth}
                  disabled={currentIndex >= MONTHS.length - 1}
                  className="p-2 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              <div className="w-10"></div> {/* Spacer balancing left */}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {compactHeader}
      <div className="w-full space-y-6 py-4">
        {/* 1. Sport Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full">
            {[
              { label: "배구 🏐", value: "VOLLEYBALL" },
              { label: "농구 🏀", value: "BASKETBALL" },
            ].map((sport) => (
              <button
                key={sport.value}
                onClick={() => updateFilter({ sport: sport.value })}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                  currentSport === sport.value
                    ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                {sport.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Top Tabs (Gender - Match V-League or K-League text dynamically?) */}
        <div className="flex justify-center">
          <div className="flex gap-2">
            {[
              { label: "전체", value: "ALL" },
              { label: currentSport === "BASKETBALL" ? "KBL 남자부" : "V-리그 남자부", value: "MEN" },
              { label: currentSport === "BASKETBALL" ? "WKBL 여자부" : "V-리그 여자부", value: "WOMEN" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => updateFilter({ gender: tab.value })}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                  currentGender === tab.value
                    ? "bg-blue-600 border-blue-600 text-white shadow-md"
                    : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Month Navigation */}
        <div className="flex flex-col items-center space-y-4">
          {/* Year Label */}
          <div className="flex items-center gap-2 text-zinc-800 dark:text-white font-bold text-xl">
            <span>2025-26</span>
          </div>

          {/* Months Strip */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 w-full px-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            {MONTHS.map((m) => (
              <button
                key={m.value}
                onClick={() => updateFilter({ month: m.value })}
                className={`pb-2 text-lg font-medium transition-all relative ${
                  currentMonth === m.value
                    ? "text-blue-600 dark:text-blue-400 font-bold"
                    : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                }`}
              >
                {m.label}
                {currentMonth === m.value && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Team Emblems (Conditional) */}
        {currentGender !== "ALL" && (
          <div className="flex justify-center animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-wrap gap-4 justify-center max-w-4xl px-4">
              {/* 'All Teams' Button for the selected gender */}
              <button
                onClick={() => updateFilter({ team: "ALL" })}
                className={`flex flex-col items-center gap-2 p-2 transition-all opacity-80 hover:opacity-100`}
              >
                <div
                  className={`w-12 h-12 flex items-center justify-center rounded-full shadow-sm transition-all bg-white dark:bg-zinc-800 ${
                    currentTeam === "ALL" ? "ring-2 ring-blue-600 scale-110" : "ring-1 ring-zinc-200 dark:ring-zinc-700"
                  }`}
                >
                  {}
                  <Image
                    src={
                      currentSport === "BASKETBALL"
                        ? currentGender === "WOMEN"
                          ? "/teams/wkbl_logo.svg"
                          : "/teams/kbl_logo.svg"
                        : "https://cdn.dev.kovo.co.kr/favicons/kovo.svg"
                    }
                    alt="전체"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    currentTeam === "ALL" ? "text-blue-600 font-bold" : "text-zinc-500"
                  }`}
                >
                  전체
                </span>
              </button>

              {displayedTeams.map((team) => (
                <button
                  key={team}
                  onClick={() => updateFilter({ team })}
                  className={`flex flex-col items-center gap-2 p-2 transition-all opacity-80 hover:opacity-100`}
                >
                  <div
                    className={`w-12 h-12 relative transition-all ${
                      currentTeam === team ? "scale-110 drop-shadow-md" : ""
                    }`}
                  >
                    {}
                    <Image
                      src={getTeamEmblem(team)}
                      alt={team}
                      fill
                      className="object-contain drop-shadow-sm group-hover:drop-shadow-md transition-all"
                      sizes="48px"
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      currentTeam === team ? "text-black dark:text-white font-bold" : "text-zinc-500"
                    }`}
                  >
                    {team}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
