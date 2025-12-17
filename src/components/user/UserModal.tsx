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

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      fetch(`/api/users/${userId}/public`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProfile(data.data);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setProfile(null);
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-80 rounded-2xl p-6 shadow-2xl relative scale-100 transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-4 right-4 text-zinc-400 hover:text-red-500" onClick={onClose}>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center">
            {/* Avatar */}
            <div className="w-24 h-24 bg-zinc-100 rounded-full mb-4 relative overflow-hidden border-4 border-white dark:border-zinc-800 shadow-lg">
              <Image src={`/avatars/${profile.avatar_id || 1}.png`} alt="avatar" fill className="object-cover" />
            </div>

            {/* Nickname & Team */}
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{profile.nickname}</h2>
            {profile.my_team ? (
              <div className="flex items-center gap-2 mb-4 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full border border-red-100 dark:border-red-900/50">
                <div className="w-5 h-5 relative">
                  <Image src={getTeamEmblem(profile.my_team)} alt={profile.my_team} fill className="object-contain" />
                </div>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{profile.my_team} 팬</span>
              </div>
            ) : (
              <span className="text-sm text-zinc-400 mb-4">아직 응원 팀이 없습니다</span>
            )}

            {/* Info Grid */}
            <div className="w-full grid grid-cols-2 gap-2 text-center text-sm mb-4">
              {profile.mbti && (
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg text-zinc-600 dark:text-zinc-300">
                  <span className="block text-xs text-zinc-400 mb-1">MBTI</span>
                  <span className="font-bold">{profile.mbti}</span>
                </div>
              )}
              {profile.age_group && (
                <div className="bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg text-zinc-600 dark:text-zinc-300">
                  <span className="block text-xs text-zinc-400 mb-1">연령대</span>
                  <span className="font-bold">{profile.age_group}</span>
                </div>
              )}
            </div>

            {/* Cheering Styles */}
            {profile.cheering_styles &&
              Array.isArray(profile.cheering_styles) &&
              profile.cheering_styles.length > 0 && (
                <div className="w-full">
                  <p className="text-xs text-zinc-400 mb-2 text-center">응원 스타일</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profile.cheering_styles.map((style: string) => (
                      <span
                        key={style}
                        className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-600 dark:text-zinc-300"
                      >
                        #{style}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="text-center py-10 text-zinc-400">사용자 정보를 불러올 수 없습니다.</div>
        )}
      </div>
    </div>
  );
}
