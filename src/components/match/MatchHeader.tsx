"use client";

import { getTeamEmblem } from "@/lib/utils";
import { Match } from "@/services/match.service";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { useMemo } from "react";

interface MatchHeaderProps {
  match: Match;
}

export default function MatchHeader({ match }: MatchHeaderProps) {
  const matchDate = useMemo(() => new Date(match.match_date), [match.match_date]);

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
        {/* Match Info */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-6 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {format(matchDate, "yyyy.MM.dd (EEE)", { locale: ko })}
            </span>
            <span>{format(matchDate, "HH:mm")}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{match.location}</span>
          </div>
        </div>

        {/* Score Board */}
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-16 h-16 md:w-24 md:h-24 relative drop-shadow-sm">
              <Image
                src={getTeamEmblem(match.home_team)}
                alt={match.home_team}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 64px, 96px"
              />
            </div>
            <span className="font-bold text-lg md:text-xl text-center whitespace-nowrap">{match.home_team}</span>
            {/* Rank Placeholder */}
            {/* <span className="text-xs text-zinc-500">1위</span> */}
          </div>

          {/* Score */}
          <div className="flex flex-col items-center px-4 md:px-8">
            {match.status === "SCHEDULED" ? (
              <div className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                <span className="text-sm font-bold text-zinc-500">VS</span>
              </div>
            ) : (
              <div className="flex items-center gap-4 md:gap-8">
                <span
                  className={`text-3xl md:text-5xl font-black ${
                    match.home_score > match.away_score ? "text-blue-600" : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {match.home_score}
                </span>
                <div className="flex flex-col items-center gap-1">
                  {match.status === "LIVE" && (
                    <span className="text-xs font-bold text-red-500 animate-pulse">LIVE</span>
                  )}
                  <span className="text-zinc-300 dark:text-zinc-700 text-xl font-light">:</span>
                </div>
                <span
                  className={`text-3xl md:text-5xl font-black ${
                    match.away_score > match.home_score ? "text-blue-600" : "text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {match.away_score}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-3 flex-1">
            <div className="w-16 h-16 md:w-24 md:h-24 relative drop-shadow-sm">
              <Image
                src={getTeamEmblem(match.away_team)}
                alt={match.away_team}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 64px, 96px"
              />
            </div>
            <span className="font-bold text-lg md:text-xl text-center whitespace-nowrap">{match.away_team}</span>
            {/* Rank Placeholder */}
            {/* <span className="text-xs text-zinc-500">2위</span> */}
          </div>
        </div>
      </div>
    </div>
  );
}
