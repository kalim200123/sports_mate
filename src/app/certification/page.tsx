"use client";

import { StampCalendar } from "@/components/profile/StampCalendar";
import { Match } from "@/services/match.service";
import { useUserStore } from "@/store/use-user-store";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Certification {
  match_id: number;
  image_url: string;
  match_date: Date | string;
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export default function CertificationPage() {
  const router = useRouter();
  const { status } = useSession();
  const { user } = useUserStore();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [teamMatches, setTeamMatches] = useState<Match[]>([]);

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    // 1. Fetch Team Schedule if user has a team
    if (user.my_team) {
      const fetchSchedule = async () => {
        try {
          const res = await fetch(`/api/matches/team?teamName=${encodeURIComponent(user.my_team!)}&includePast=true`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (data.success) setTeamMatches(data.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchSchedule();

      // 2. Fetch Certifications
      const fetchCerts = async () => {
        try {
          const res = await fetch(`/api/users/certifications?userId=${user.id}`);
          const data = await res.json();
          if (data.success) setCertifications(data.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchCerts();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/profile" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <svg
              className="w-6 h-6 text-zinc-600 dark:text-zinc-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">직관 인증 캘린더</h1>
        </div>

        {!user.my_team ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-200 dark:border-zinc-800 shadow-sm mt-10">
            <div className="text-4xl mb-4">🏟️</div>
            <p className="text-zinc-500 mb-6 font-medium">응원하는 팀이 설정되지 않았습니다.</p>
            <Link
              href="/profile"
              className="inline-block bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-red-500/30"
            >
              프로필에서 팀 설정하기
            </Link>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StampCalendar myTeam={user.my_team} matches={teamMatches} certifications={certifications} />

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 text-center border border-blue-100 dark:border-blue-800/30">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">💡 직관 인증하는 방법</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 leading-relaxed">
                캘린더 날짜를 클릭하여 직관 일기를 작성해보세요.
                <br />
                <b>인증샷</b>과 함께 기록을 남기면
                <br />
                관리자 승인 후 스탬프가 발급됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
