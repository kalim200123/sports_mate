"use client";

import { getTeamEmblem } from "@/lib/utils";
import { User } from "@/types/db";
import Image from "next/image";

interface UserRankingListProps {
  users: User[];
}

export function UserRankingList({ users }: UserRankingListProps) {
  if (users.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500">
        <p>아직 랭킹 데이터가 부족합니다.</p>
        <p className="text-xs mt-1">5경기 이상 직관 인증을 완료해보세요!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {users.map((user, index) => (
        <div
          key={user.id}
          className={`flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
            index < 3 ? "bg-gradient-to-r from-yellow-50/50 via-transparent to-transparent dark:from-yellow-900/10" : ""
          }`}
        >
          {/* Left: Rank & Info */}
          <div className="flex items-center gap-4">
            {/* Rank Badge */}
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-lg ${
                index === 0
                  ? "bg-yellow-400 text-white shadow-md shadow-yellow-200"
                  : index === 1
                  ? "bg-zinc-300 text-white shadow-md"
                  : index === 2
                  ? "bg-amber-600 text-white shadow-md"
                  : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {index + 1}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-zinc-200">
                <Image src={user.profile_image_url || "/avatars/1.png"} alt="profile" fill className="object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  {user.nickname}
                  {user.my_team && (
                    <div
                      className="relative w-4 h-4 rounded-full overflow-hidden inline-block ml-0.5"
                      title={`${user.my_team} 팬`}
                    >
                      <Image src={getTeamEmblem(user.my_team)} alt={user.my_team} fill className="object-cover" />
                    </div>
                  )}
                </span>
                <span className="text-[10px] text-zinc-500">{user.title || "신입 메이트"}</span>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="text-right">
            <div className="text-base font-bold text-blue-600 dark:text-blue-400">{user.win_rate}%</div>
            <div className="text-xs text-zinc-500">
              {user.win_count}승 {user.loss_count}패
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
