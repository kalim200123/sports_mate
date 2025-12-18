"use client";

import { getTeamEmblem } from "@/lib/utils";
import { Match } from "@/services/match.service";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface MatchCarouselProps {
  matches: Match[];
  title: string;
}

export default function MatchCarousel({ matches, title }: MatchCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (matches.length === 0) {
    return (
      <section className="py-4 px-4 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">{title}</h2>
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 text-center text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800">
          <p>예정된 경기가 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 px-4 max-w-5xl mx-auto w-full">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1 flex items-center gap-2">
        {title}
        <Link
          href="/schedule"
          className="text-sm font-normal text-zinc-500 hover:text-red-500 ml-auto flex items-center"
        >
          전체 일정 <span className="text-lg leading-none ml-1">›</span>
        </Link>
      </h2>

      <div className="relative group/schedule">
        {/* Left Button (Desktop Only) */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover/schedule:opacity-100 transition-opacity hover:bg-zinc-50"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Button (Desktop Only) */}
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover/schedule:opacity-100 transition-opacity hover:bg-zinc-50"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide flex p-1 gap-4 no-scrollbar snap-x snap-mandatory touch-pan-x pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className="min-w-[260px] md:min-w-[280px] snap-center block"
            >
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-600 transition-all hover:shadow-md h-full flex flex-col items-center relative group card-hover-effect">
                {/* Sport Badge */}
                <div className="absolute top-4 left-4">
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      match.sport === "BASKETBALL"
                        ? "bg-orange-100 text-orange-600 border border-orange-200"
                        : "bg-blue-100 text-blue-600 border border-blue-200"
                    }`}
                  >
                    {match.sport === "BASKETBALL" ? "🏀 농구" : "🏐 배구"}
                  </span>
                </div>

                {/* Date & Location */}
                <div className="text-center mb-6 w-full pt-6">
                  <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                    {format(new Date(match.match_date), "MM.dd (EEE)", { locale: ko })}
                    <span className="ml-2 text-zinc-500 font-normal text-base">
                      {format(new Date(match.match_date), "HH:mm")}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium tracking-tight">
                    {match.location || "경기장 미정"}
                  </div>
                </div>

                {/* Teams VS */}
                <div className="flex items-center justify-between w-full mb-4 px-2">
                  {/* Home */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-14 h-14 relative drop-shadow-sm">
                      <Image
                        src={getTeamEmblem(match.home_team)}
                        alt={match.home_team}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center break-keep leading-tight">
                      {match.home_team}
                    </span>
                  </div>

                  {/* VS / Score */}
                  <div className="flex flex-col items-center justify-center px-3">
                    {match.status === "COMPLETED" || match.status === "LIVE" ? (
                      <div className="flex gap-2 items-center text-xl font-black text-zinc-800 dark:text-zinc-100 font-mono">
                        <span className={match.home_score > match.away_score ? "text-red-500" : ""}>
                          {match.home_score}
                        </span>
                        <span className="text-zinc-300 text-sm">:</span>
                        <span className={match.away_score > match.home_score ? "text-red-500" : ""}>
                          {match.away_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-zinc-300 italic">VS</span>
                    )}
                    {match.status === "LIVE" && (
                      <span className="mt-1 text-[10px] font-bold text-red-500 animate-pulse">LIVE</span>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-14 h-14 relative drop-shadow-sm">
                      <Image
                        src={getTeamEmblem(match.away_team)}
                        alt={match.away_team}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center break-keep leading-tight">
                      {match.away_team}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
