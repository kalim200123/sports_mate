"use client";

import { getTeamEmblem } from "@/lib/utils";
import { User } from "@/types/db";
import Image from "next/image";
import { useEffect, useState } from "react";

interface UserModalProps {
  userId: number | null;
  onClose: () => void;
}

export default function UserModal({ userId, onClose }: UserModalProps) {
  const [profile, setProfile] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    if (userId) {
      // Fetch logic
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/users/${userId}/public`);
          const data = await res.json();
          if (data.success) {
            setProfile(data.data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else {
      setProfile(null);
      setIsReporting(false);
      setReportReason("");
    }
  }, [userId]);

  const handleReport = async () => {
    if (!reportReason) return alert("신고 사유를 선택해주세요.");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: userId,
          reason: reportReason,
          description: "UserModal Report",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("신고가 접수되었습니다. 관리자 검토 후 조치됩니다.");
        setIsReporting(false);
        onClose();
      } else {
        alert("신고 접수에 실패했습니다: " + data.error);
      }
    } catch (e) {
      console.error("Report error", e);
      alert("신고 중 오류가 발생했습니다.");
    }
  };

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-[350px] rounded-3xl p-6 shadow-2xl relative scale-100 transition-transform border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 z-10" onClick={onClose}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : isReporting ? (
          // Report Form View
          <div className="flex flex-col h-full animate-in slide-in-from-right-10 duration-200">
            <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              사용자 신고
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              <span className="font-bold text-zinc-900 dark:text-white">{profile?.nickname}</span>님을 신고하시겠습니까?
              <br />
              허위 신고 시 제재를 받을 수 있습니다.
            </p>

            <div className="space-y-2 mb-6">
              {["부적절한 닉네임", "욕설/비하 발언", "스팸/홍보", "도배 행위", "기타"].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => setIsReporting(false)}
                className="flex-1 py-3 text-zinc-600 bg-zinc-100 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                취소
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason}
                className="flex-1 py-3 text-white bg-red-600 rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                신고제출
              </button>
            </div>
          </div>
        ) : profile ? (
          // Profile Details View
          <div className="flex flex-col items-center">
            {/* Title / Badge */}
            {profile.title && (
              <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold rounded-full shadow-sm mb-4">
                🏆 {profile.title}
              </span>
            )}

            {/* Avatar */}
            <div className="w-28 h-28 bg-zinc-100 rounded-full mb-4 relative overflow-hidden border-[6px] border-zinc-50 dark:border-zinc-800 shadow-xl group">
              <Image src={profile.profile_image_url || "/avatars/1.png"} alt="avatar" fill className="object-cover" />
            </div>

            {/* Nickname & Team */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2">{profile.nickname}</h2>
              {profile.my_team ? (
                <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                  <div className="w-5 h-5 relative">
                    <Image src={getTeamEmblem(profile.my_team)} alt={profile.my_team} fill className="object-contain" />
                  </div>
                  <div className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                    {profile.total_visits || 0}
                    <span className="text-sm font-normal text-zinc-500 ml-0.5">회</span>
                  </div>
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{profile.my_team} 팬</span>
                </div>
              ) : (
                <span className="text-sm text-zinc-400">자유로운 관람러</span>
              )}
            </div>

            {/* Stats Grid */}
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl text-center">
                <span className="block text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">직관 승률</span>
                <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
                  {profile.win_rate !== undefined ? `${profile.win_rate}%` : "-"}
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {profile.win_count || 0}승 {profile.loss_count || 0}패
                </span>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl text-center">
                <span className="block text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">직관 횟수</span>
                <span className="text-2xl font-black text-purple-700 dark:text-purple-300">
                  {profile.total_visits !== undefined ? `${profile.total_visits}회` : "-"}
                </span>
              </div>
            </div>

            {/* Detail Info */}
            <div className="w-full space-y-3 mb-8">
              <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">연령대</span>
                <span className="font-medium">{profile.age_group || "비공개"}</span>
              </div>
              <div className="flex justify-between items-center text-sm py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">MBTI</span>
                <span className="font-medium">{profile.mbti || "비공개"}</span>
              </div>
              <div className="pt-2">
                <span className="text-xs text-zinc-400 block mb-2">응원 스타일</span>
                <div className="flex flex-wrap gap-2">
                  {profile.cheering_styles &&
                  Array.isArray(profile.cheering_styles) &&
                  profile.cheering_styles.length > 0 ? (
                    profile.cheering_styles.map((style: string) => (
                      <span
                        key={style}
                        className="text-xs px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-medium text-zinc-600 dark:text-zinc-300"
                      >
                        #{style}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400">등록된 스타일이 없습니다</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsReporting(true)}
              className="w-full py-3 text-red-500 text-sm font-bold bg-red-50 dark:bg-red-900/10 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
                />
              </svg>
              사용자 신고하기
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-400">사용자 정보를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}
