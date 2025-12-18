import MatchCarousel from "@/components/match/MatchCarousel";
import { MatchService } from "@/services/match.service";
import Link from "next/link";

export const dynamic = "force-dynamic"; // Ensure fresh data on every request

export default async function Home() {
  const matches = await MatchService.getUpcomingMatches(10);

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

      {/* 4. Hot Live Rooms (Placeholder) */}
      <section className="py-4 px-4 max-w-5xl mx-auto w-full">
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">💬 실시간 인기 응원방</h2>
          <Link href="/rooms" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300">
            더보기 &gt;
          </Link>
        </div>

        {/* Empty State for Dashboard MVP */}
        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-8 text-center text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800">
          <p>현재 뜨거운 응원방이 없습니다.</p>
          <p className="text-sm mt-1">곧 경기가 시작되면 응원방이 생길 거예요!</p>
        </div>
      </section>

      {/* 5. My Stats (Login Required Placeholder) */}
      <section className="py-4 px-4 max-w-5xl mx-auto w-full mb-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 px-1">👑 나의 직관 승률</h2>
        <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-lg font-bold mb-2">로그인이 필요해요</p>
          <p className="text-zinc-400 text-sm mb-4">로그인하고 나의 직관 승률을 확인해보세요.</p>
          <Link href="/login" className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg">
            로그인하기
          </Link>
        </div>
      </section>
    </div>
  );
}
