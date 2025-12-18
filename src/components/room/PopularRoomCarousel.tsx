"use client";

import { getTeamEmblem } from "@/lib/utils";
import { Room } from "@/types/db";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";

interface PopularRoomCarouselProps {
  rooms: Room[];
}

export function PopularRoomCarousel({ rooms }: PopularRoomCarouselProps) {
  if (rooms.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 px-4">
        <h2 className="text-lg font-bold">🔥 지금 뜨는 직관 메이트</h2>
      </div>

      <div className="flex overflow-x-auto gap-3 px-4 pb-4 no-scrollbar snap-x">
        {rooms.map((room) => (
          <Link key={room.id} href={`/rooms/${room.id}`} className="flex-shrink-0 w-[240px] snap-center">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-red-400 transition-all hover:shadow-md h-full flex flex-col justify-between">
              {/* Header: Sport & Count */}
              <div className="flex justify-between items-center mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    room.sport === "BASKETBALL"
                      ? "bg-orange-50 text-orange-600 border-orange-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}
                >
                  {room.sport === "BASKETBALL" ? "🏀 농구" : "🏐 배구"}
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {room.current_count || 0}/{room.max_count}명
                </span>
              </div>

              {/* Title */}
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mb-3 line-clamp-2 min-h-[40px]">
                {room.title}
              </h3>

              {/* Match Info */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  <div className="flex items-center gap-1">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-zinc-100 bg-white">
                      <Image src={getTeamEmblem(room.home_team || "")} alt="home" fill className="object-cover" />
                    </div>
                    <span className="truncate max-w-[50px]">{room.home_team}</span>
                  </div>
                  <span className="text-zinc-400 text-[10px]">vs</span>
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[50px]">{room.away_team}</span>
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-zinc-100 bg-white">
                      <Image src={getTeamEmblem(room.away_team || "")} alt="away" fill className="object-cover" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 text-center">
                  {format(new Date(room.match_date || new Date()), "M.d(EEE) HH:mm", { locale: ko })}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
