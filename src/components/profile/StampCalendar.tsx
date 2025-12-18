"use client";

import { getTeamEmblem } from "@/lib/utils";
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { useState } from "react";

interface Match {
  id: number;
  match_date: Date | string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status?: string;
}

interface Certification {
  match_id: number;
  image_url: string;
  match_date: Date | string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

interface StampCalendarProps {
  myTeam: string;
  matches: Match[]; // Team Schedule
  certifications: Certification[]; // User Certifications
}

export function StampCalendar({ myTeam, matches, certifications }: StampCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Logic: Strip suffix for comparisons with DB Match Team Names
  const pureMyTeam = myTeam.replace(/\((배구|농구)\)/, "").trim();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Global Stats (Calculated from all available data, not just current month)

  const validMatches = matches.filter((m) => m.status === "ENDED" || m.status === "COMPLETED");
  const attendedMatches = validMatches.filter((m) =>
    certifications.some((c) => Number(c.match_id) === Number(m.id) && c.status === "APPROVED")
  );
  const totalVisits = attendedMatches.length;

  const totalWins = attendedMatches.filter((m) => {
    const isHome = m.home_team.trim() === pureMyTeam;
    const isAway = m.away_team.trim() === pureMyTeam;

    // Safety check
    if (!isHome && !isAway) return false;

    return isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
  }).length;

  const totalWinRate = attendedMatches.length > 0 ? Math.round((totalWins / attendedMatches.length) * 100) : 0;

  // History List (Past matches - Attended Only)
  const myAttendedHistory = matches
    .filter((m) => {
      const isEnded = m.status === "ENDED" || m.status === "COMPLETED";
      const isAttended = certifications.some((c) => Number(c.match_id) === Number(m.id) && c.status === "APPROVED");
      return isEnded && isAttended;
    })
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT: Calendar (Compact, Reduced size) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="text-base">{format(currentDate, "yyyy.MM", { locale: ko })}</span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              오늘
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-bold py-1 ${i === 0 ? "text-red-500" : "text-zinc-500"}`}
            >
              {d}
            </div>
          ))}

          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const dayMatch = matches.find((m) => isSameDay(new Date(m.match_date), day));
            const cert = certifications.find((c) => isSameDay(new Date(c.match_date), day) && c.status === "APPROVED");

            let result = "NONE";
            let resultText = "";
            if (dayMatch && (dayMatch.status === "ENDED" || dayMatch.status === "COMPLETED")) {
              const MyScore = dayMatch.home_team.trim() === pureMyTeam ? dayMatch.home_score : dayMatch.away_score;
              const OpScore = dayMatch.home_team.trim() === pureMyTeam ? dayMatch.away_score : dayMatch.home_score;
              if (MyScore > OpScore) result = "WIN";
              else if (MyScore < OpScore) result = "LOSE";

              resultText = `${MyScore}:${OpScore}`;
            }

            return (
              <div
                key={day.toISOString()}
                className={`aspect-square rounded-lg border relative flex flex-col items-center justify-start py-1 overflow-hidden transition-all
                  ${
                    isSameDay(day, new Date())
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-transparent border-zinc-50 dark:border-zinc-800"
                  }
                  ${dayMatch ? "hover:border-red-200 cursor-default" : ""}
                `}
              >
                <span
                  className={`text-[9px] w-full text-right px-1 mb-0.5 ${
                    day.getDay() === 0 ? "text-red-500" : "text-zinc-400"
                  }`}
                >
                  {day.getDate()}
                </span>

                {dayMatch && (
                  <div className="flex flex-col items-center justify-center w-full h-full pb-3 gap-0.5 z-0">
                    {/* Opponent Logo - Bigger */}
                    <div className="w-6 h-6 md:w-8 md:h-8 relative opacity-60">
                      <Image
                        src={getTeamEmblem(
                          dayMatch.home_team.trim() === pureMyTeam ? dayMatch.away_team : dayMatch.home_team
                        )}
                        alt="opponent"
                        fill
                        className="object-contain"
                      />
                    </div>
                    {/* Result Text - Bigger */}
                    <div className="flex flex-col items-center leading-none">
                      <span
                        className={`text-[10px] md:text-xs font-bold leading-tight ${
                          result === "WIN" ? "text-red-500" : result === "LOSE" ? "text-zinc-400" : "text-zinc-800"
                        }`}
                      >
                        {result === "WIN"
                          ? "승"
                          : result === "LOSE"
                          ? "패"
                          : format(new Date(dayMatch.match_date), "HH:mm")}
                      </span>
                      {(result === "WIN" || result === "LOSE") && (
                        <span className="text-[8px] md:text-[9px] text-zinc-500 font-medium mt-0.5">{resultText}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stamp Overlay - Smaller */}
                {cert && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20 dark:bg-black/10 backdrop-blur-[0px] rounded-lg animate-in zoom-in duration-300 z-10 pointer-events-none">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 transform rotate-[-12deg] drop-shadow-md opacity-80">
                      <div className="absolute inset-0 border-[3px] border-red-600 rounded-full" />
                      <Image src={getTeamEmblem(myTeam)} alt="Stamp" fill className="object-contain p-0.5" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Stats & History */}
      <div className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
        {/* Stats Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h4 className="text-sm font-bold text-zinc-500 mb-4 flex items-center gap-2">
            📊 직관 요약
            <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">All Time</span>
          </h4>
          <div className="flex items-center justify-between text-center px-4">
            <div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-1">{totalVisits}</div>
              <div className="text-xs text-zinc-400 font-medium">총 직관 횟수</div>
            </div>
            <div className="w-px h-10 bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <div className="text-3xl font-black text-red-500 mb-1">{totalWinRate}%</div>
              <div className="text-xs text-zinc-400 font-medium">직관 승률</div>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
              내 직관 기록 <span className="text-zinc-400 text-xs font-normal">({myAttendedHistory.length})</span>
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {myAttendedHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                인증된 직관 기록이 없습니다.
              </div>
            ) : (
              myAttendedHistory.map((match) => {
                let result = "NONE";
                if (match.status === "ENDED" || match.status === "COMPLETED") {
                  const isHome = match.home_team.trim() === pureMyTeam;
                  const myScore = isHome ? match.home_score : match.away_score;
                  const opScore = isHome ? match.away_score : match.home_score;

                  if (myScore > opScore) result = "WIN";
                  else if (myScore < opScore) result = "LOSE";
                }

                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 rounded-2xl hover:border-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Win/Loss Badge */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                          result === "WIN"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : result === "LOSE"
                            ? "bg-zinc-100 text-zinc-500 border border-zinc-200"
                            : "bg-blue-50 text-blue-500"
                        }`}
                      >
                        {result === "WIN" ? "WIN" : result === "LOSE" ? "LOSE" : "-"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {format(new Date(match.match_date), "yy.MM.dd")} (직관)
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            vs {match.home_team === pureMyTeam ? match.away_team : match.home_team}
                          </span>
                          <div className="relative w-4 h-4 rounded-full overflow-hidden border border-zinc-100">
                            <Image
                              src={getTeamEmblem(match.home_team === pureMyTeam ? match.away_team : match.home_team)}
                              alt="op"
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
