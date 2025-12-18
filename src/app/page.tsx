import MatchCarousel from "@/components/match/MatchCarousel";
import { PopularRoomCarousel } from "@/components/room/PopularRoomCarousel";
import { UserRankingList } from "@/components/user/UserRankingList";
import { MatchService } from "@/services/match.service";
import { RoomService } from "@/services/room.service";
import { UserService } from "@/services/user.service";
import Link from "next/link";

export const dynamic = "force-dynamic"; // Ensure fresh data on every request

export default async function Home() {
  const matches = await MatchService.getTodaysMatches();
  const popularRooms = await RoomService.getPopularRooms(5);
  const rankings = await UserService.getRankings(5);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 font-sans pb-20">
      {/* 1. Hero / Banner Section */}
      <section className="relative w-full h-64 bg-gradient-to-br from-blue-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">오늘의 직관, 승리의 요정이 되어보세요! 🧚</h1>
          <p className="text-blue-100 text-lg mb-6">함께 응원할 메이트를 찾고, 직관 기록을 남겨보세요.</p>
          <Link
            href="/schedule"
            className="px-6 py-3 bg-white text-blue-600 font-bold rounded-full shadow-lg hover:bg-zinc-100 transition-transform hover:scale-105 active:scale-95"
          >
            경기 일정 보러가기 🗓️
          </Link>
        </div>
      </section>

      {/* 2. Quick Menu Grid */}
      <section className="py-8 px-4 max-w-5xl mx-auto w-full">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">바로가기</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/schedule?sport=VOLLEYBALL"
            className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-zinc-100 dark:border-zinc-800"
          >
            <span className="text-3xl mb-2">🏐</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">배구 일정</span>
          </Link>
          <Link
            href="/schedule?sport=BASKETBALL"
            className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors border border-zinc-100 dark:border-zinc-800"
          >
            <span className="text-3xl mb-2">🏀</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">농구 일정</span>
          </Link>
          <Link
            href="/rooms"
            className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border border-zinc-100 dark:border-zinc-800"
          >
            <span className="text-3xl mb-2">📣</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">직관 동행</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-zinc-100 dark:border-zinc-800"
          >
            <span className="text-3xl mb-2">🎫</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">직관 인증</span>
          </Link>
        </div>
      </section>

      {/* 3. Today's Matches Carousel */}
      <MatchCarousel matches={matches} title="🔥 오늘의 경기" />

      {/* 4. Hot Live Rooms */}
      <section className="py-4 max-w-5xl mx-auto w-full">
        <PopularRoomCarousel rooms={popularRooms} />
      </section>

      {/* 5. Win Rate Rankings */}
      <section className="py-4 px-4 max-w-5xl mx-auto w-full mb-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">👑 직관 승률 랭킹</h2>
        <UserRankingList users={rankings} />
      </section>
    </div>
  );
}
