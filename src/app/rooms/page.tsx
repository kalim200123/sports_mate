import { getTeamEmblem } from "@/lib/utils";
import { RoomService } from "@/services/room.service";
import { RoomStatus } from "@/types/db";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

import RoomFilterBar from "./_components/RoomFilterBar";

// Optional: Force dynamic refetch if needed, though searchParams usually triggers it in server components.
export const dynamic = "force-dynamic";

interface RoomsPageProps {
  searchParams: Promise<{
    sport?: string;
    region?: string;
    status?: "RECRUITING" | "ALL";
    includePast?: string;
  }>;
}

export default async function RoomsPage({ searchParams }: RoomsPageProps) {
  const params = await searchParams; // Next.js 15 requires awaiting searchParams

  const sport = params.sport || "ALL";
  const region = params.region || "ALL";
  const status = (params.status as "RECRUITING" | "ALL") || "ALL";
  const includePast = params.includePast === "true"; // Default to false if missing

  const rooms = await RoomService.getRooms({
    sport,
    region,
    status,
    includePast,
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            &lt; 메인
          </Link>
          <h1 className="text-lg font-bold">직관 동행 거실 🛋️</h1>
          <div className="w-8" /> {/* Placeholder for balance */}
        </div>

        {/* Filter Bar */}
        <RoomFilterBar />
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Banner / Create Room Button */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {sport === "ALL" ? "모든 응원방" : sport === "VOLLEYBALL" ? "배구 직관 메이트" : "농구 직관 메이트"}
            </h2>
            <p className="text-sm text-zinc-500">함께 직관갈 친구를 찾아보세요!</p>
          </div>
          {/* Floating Action Button style or just primary button */}
        </div>

        {/* Room Grid */}
        {rooms.length === 0 ? (
          <div className="py-20 text-center text-zinc-400">
            <span className="text-4xl block mb-2">🏜️</span>
            <p>아직 생성된 방이 없습니다.</p>
            <p className="text-sm">가장 먼저 방을 만들어보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`} className="block h-full">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-red-400 dark:hover:border-red-600 transition-all hover:shadow-md h-full flex flex-col relative group">
                  {/* Sport Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        room.sport === "BASKETBALL"
                          ? "bg-orange-50 text-orange-600 border-orange-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                      }`}
                    >
                      {room.sport === "BASKETBALL" ? "🏀 농구" : "🏐 배구"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        room.status === RoomStatus.RECRUITING || (room.current_count || 0) < room.max_count
                          ? "bg-green-100 text-green-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {room.current_count || 0}/{room.max_count}명
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1 group-hover:text-red-500 transition-colors">
                    {room.title}
                  </h3>

                  {/* Match Info */}
                  <div className="mt-auto pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-100 bg-white shadow-sm">
                          <Image src={getTeamEmblem(room.home_team || "")} alt="home" fill className="object-cover" />
                        </div>
                        <span className="truncate max-w-[60px] md:max-w-none">{room.home_team}</span>
                      </div>
                      <span className="text-zinc-400 mx-1">vs</span>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[60px] md:max-w-none">{room.away_team}</span>
                        <div className="relative w-6 h-6 rounded-full overflow-hidden border border-zinc-100 bg-white shadow-sm">
                          <Image src={getTeamEmblem(room.away_team || "")} alt="away" fill className="object-cover" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span>
                        📅 {format(new Date(room.match_date || new Date()), "MM.dd(EEE) HH:mm", { locale: ko })}
                      </span>
                      <span>📍 {room.region || "지역 미정"}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Write Button (Fixed Bottom Right) */}
      {/* Assuming user can find create room button inside match detail or here? */}
      {/* User says "Create Room" button should be here. But Creating room requires selecting a match. */}
      {/* Usually flow is: Match Schedule -> Select Match -> Create Room. */}
      {/* OR: Create Room -> Select Match modal. */}
      {/* For now, maybe just link to Schedule page saying "Go to Schedule to Create Room"? */}
      {/* Or if we have a create room page, link there. Missing Create Room Page context. */}
      {/* I'll add a floating button that alerts or links to schedule. */}
      {/* Actually existing flow seems to be only via Match Detail? */}
      {/* I will add a button that redirects to /schedule with a toast or just text "일정에서 방 만들기". */}

      <Link
        href="/schedule"
        className="fixed bottom-24 right-5 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-transform hover:scale-105 active:scale-95 z-40"
        title="방 만들기 (경기 일정에서 선택)"
      >
        <span className="text-2xl">➕</span>
      </Link>
    </div>
  );
}
