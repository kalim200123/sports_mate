import MatchAuthActions from "@/components/match/MatchAuthActions";
import MatchFilter from "@/components/MatchFilter";
import ScrollToTop from "@/components/ScrollToTop";
import { getTeamEmblem } from "@/lib/utils";
import { MatchFilters, MatchService } from "@/services/match.service";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";

export const revalidate = 0; // Disable cache for real-time updates

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function Home(props: PageProps) {
  const searchParams = await props.searchParams;

  const filters: MatchFilters = {
    gender: (searchParams.gender as "MEN" | "WOMEN" | "ALL") || undefined,
    team: searchParams.team === "ALL" ? undefined : searchParams.team,
    date: searchParams.date,
    month: searchParams.month || (searchParams.date ? undefined : "2025-12"), // Default validation
  };

  const matches = await MatchService.getMatches(filters);

  // Group matches by date
  const matchesByDate = matches.reduce((acc, match) => {
    const dateKey = format(match.match_date, "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  const sortedDates = Object.keys(matchesByDate).sort();

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#121212] font-sans">
      {/* Header & Sticky Filter */}
      <div className="bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-300">
        <div className="w-full max-w-5xl mx-auto px-4 py-4">
          <MatchFilter />
        </div>
      </div>

      {/* Match List */}
      <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-8 pb-20">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
            <div className="text-4xl">🏐</div>
            <p className="text-zinc-500 font-medium">예정된 경기가 없습니다.</p>
          </div>
        ) : (
          sortedDates.map((dateKey) => {
            const dateMatches = matchesByDate[dateKey];
            const dateObj = new Date(dateKey);
            return (
              <div
                key={dateKey}
                className="flex flex-col shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden"
              >
                {/* Date Header */}
                <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-3 flex justify-center items-center">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                    {format(dateObj, "M월 d일 (EEE)", { locale: ko })}
                  </h3>
                </div>

                {/* Matches in this date */}
                <div className="bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                  {dateMatches.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col md:flex-row items-center p-4 md:h-24 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors gap-4 md:gap-0"
                    >
                      {/* Left: Time & Location */}
                      <div className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-1 w-full md:w-32 text-sm text-zinc-500 whitespace-nowrap px-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-300">
                          {format(match.match_date, "HH:mm")}
                        </span>
                        <span className="text-xs truncate max-w-[120px]" title={match.location}>
                          {match.location}
                        </span>
                      </div>

                      {/* Center: Match Content */}
                      <div className="flex-1 flex items-center justify-center w-full gap-4 md:gap-8">
                        {/* Home Team */}
                        <div className="flex items-center justify-end gap-3 flex-1">
                          <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm md:text-base whitespace-nowrap">
                            {match.home_team}
                          </span>
                          <div className="w-8 h-8 md:w-10 md:h-10 relative">
                            <Image
                              src={getTeamEmblem(match.home_team)}
                              alt={match.home_team}
                              fill
                              className="object-contain"
                              sizes="40px"
                            />
                          </div>
                        </div>

                        {/* Scores / Status */}
                        <div className="flex items-center gap-3 px-2 min-w-[100px] justify-center">
                          {match.status === "SCHEDULED" ? (
                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-500">
                              예정
                            </span>
                          ) : (
                            <>
                              <span
                                className={`text-xl md:text-2xl font-bold ${
                                  match.home_score > match.away_score
                                    ? "text-blue-600"
                                    : "text-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                {match.home_score}
                              </span>
                              <div className="flex flex-col items-center gap-1">
                                {match.status === "LIVE" ? (
                                  <span className="text-[10px] font-bold text-red-500 animate-pulse">LIVE</span>
                                ) : (
                                  <span className="text-[10px] text-zinc-400">종료</span>
                                )}
                              </div>
                              <span
                                className={`text-xl md:text-2xl font-bold ${
                                  match.away_score > match.home_score
                                    ? "text-blue-600"
                                    : "text-zinc-800 dark:text-zinc-300"
                                }`}
                              >
                                {match.away_score}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-start gap-3 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 relative">
                            <Image
                              src={getTeamEmblem(match.away_team)}
                              alt={match.away_team}
                              fill
                              className="object-contain"
                              sizes="40px"
                            />
                          </div>
                          <span className="font-bold text-zinc-800 dark:text-zinc-100 text-sm md:text-base whitespace-nowrap">
                            {match.away_team}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-center md:justify-end px-2 mt-2 md:mt-0">
                        <MatchAuthActions matchId={match.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
      <ScrollToTop />
    </div>
  );
}
