"use client";

import { ALL_TEAMS, CHEERING_STYLES, TITLES } from "@/lib/constants";
import { getTeamEmblem } from "@/lib/utils";
import { Match } from "@/services/match.service";
import { useUserStore } from "@/store/use-user-store";
import { Room } from "@/types/db";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Helper to combine team lists
const TEAM_LIST = ALL_TEAMS;

export default function ProfilePage() {
  const router = useRouter();
  const { status } = useSession(); // Use NextAuth session
  const { user, updateProfile } = useUserStore();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [teamMatches, setTeamMatches] = useState<Match[]>([]);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(user?.my_team || "");

  const [isEditingStyles, setIsEditingStyles] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const handleTitleSelect = async (titleName: string) => {
    if (!user) return;
    updateProfile({ title: titleName });
    await fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: titleName,
        nickname: user.nickname,
        gender: user.gender,
      }),
    });
    setIsEditingTitle(false);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 300;
      console.log("Scrolling", direction); // Debug
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    // Only redirect if explicitly unauthenticated.
    // If loading, wait.
    // If authenticated but user store empty, wait for StoreInitializer.
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch Data
  useEffect(() => {
    if (!user) return;

    // 1. Fetch My Rooms
    const fetchRooms = async () => {
      try {
        const res = await fetch(`/api/users/my-rooms?userId=${user.id}`);
        const data = await res.json();
        if (data.success) setMyRooms(data.data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRooms();

    // 2. Fetch Team Schedule if user has a team
    if (user.my_team) {
      const fetchSchedule = async () => {
        try {
          const res = await fetch(`/api/matches/team?teamName=${encodeURIComponent(user.my_team!)}`);
          const data = await res.json();
          if (data.success) setTeamMatches(data.data);
        } catch (e) {
          console.error(e);
        }
      };
      fetchSchedule();
    }
  }, [user]);

  // Update Team
  const handleTeamSave = () => {
    if (selectedTeam && user) {
      updateProfile({ my_team: selectedTeam });
      // In real app, also call API to persist to DB.
      // Assuming updateProfile only updates local store?
      // Yes, verify checking use-user-store.ts.
      // We probably need an API to update user profile.
      // MISSING API: PUT /api/users/profile
      // I will implement a quick fetch call here assuming it exists or creating it.
      // Wait, I didn't create that API yet.
      // I should stick to plan? Plan said "Create/Update APIs for User Profile".
      // I'll add the fetch call and assume I will create the route next or use existing if any.
      // Checked file list: src/app/api/users/profile/route.ts exists in context!
      fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          my_team: selectedTeam,
          nickname: user.nickname,
          gender: user.gender,
          age_group: user.age_group,
          cheering_styles: user.cheering_styles || [],
        }),
      });

      setIsEditingTeam(false);
      // Data will refresh automatically due to user state update triggering useEffect
    }
  };

  // Initialize styles from user
  useEffect(() => {
    if (user?.cheering_styles) {
      // Handle if it's a string (though it should be array in store type?)
      // In DB it is JSON. Types say cheering_styles: any inside User? or string[]?
      // Let's assume string[] based on previous context.
      setSelectedStyles(Array.isArray(user.cheering_styles) ? user.cheering_styles : []);
    }
  }, [user]);

  const handleStyleToggle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles((prev) => prev.filter((s) => s !== style));
    } else {
      if (selectedStyles.length >= 3) return; // Max 3
      setSelectedStyles((prev) => [...prev, style]);
    }
  };

  const handleStyleSave = () => {
    if (!user) return;
    updateProfile({ cheering_styles: selectedStyles });
    fetch("/api/users/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        my_team: user.my_team, // Keep existing team
        cheering_styles: selectedStyles, // Update styles
        nickname: user.nickname,
        gender: user.gender,
        age_group: user.age_group,
      }),
    });
    setIsEditingStyles(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Check size/type
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.url) throw new Error("Upload failed");

      // 2. Update Profile
      const updateRes = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: user.nickname,
          gender: user.gender,
          profile_image_url: uploadData.url,
        }),
      });

      if (updateRes.ok) {
        updateProfile({ profile_image_url: uploadData.url });
      }
    } catch (err) {
      console.error(err);
      alert("이미지 업로드에 실패했습니다.");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {/* Top Section: Stack on Mobile, Row on Desktop */}
      <div className="container mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: User Info (Red Card) */}
        <div className="md:col-span-8 lg:col-span-8">
          <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8 8-8z" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Left Column: Avatar & Basic Info */}
              <div className="flex flex-col items-center md:w-1/3 border-b md:border-b-0 md:border-r border-white/20 pb-6 md:pb-0 md:pr-6">
                <div
                  className="w-32 h-32 bg-white rounded-full mb-4 p-1 shadow-lg relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-full h-full rounded-full overflow-hidden relative border-4 border-red-50">
                    <Image
                      src={user.profile_image_url || "/avatars/1.png"}
                      alt="avatar"
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/avatars/1.png";
                        target.onerror = null;
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-bold text-white">변경</span>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-1 text-center">{user.nickname}</h2>
                <p className="text-red-100 text-sm font-mono opacity-80">{user.kakao_id || "@kakao_user"}</p>
              </div>

              {/* Right Column: Stats & Details */}
              <div className="flex-1 w-full flex flex-col gap-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Item 1: My Team */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center relative group min-h-[100px]">
                    <span className="text-xs text-red-100 mb-2">응원 팀</span>
                    {isEditingTeam ? (
                      <div className="w-full">
                        <p className="text-[10px] text-red-200 mb-2 text-center font-bold animate-pulse">
                          ⚠️ 한 번 선택하면 변경할 수 없습니다!
                        </p>
                        <select
                          className="w-full text-black text-xs p-1 rounded mb-2"
                          value={selectedTeam || ""}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                        >
                          <option value="">선택</option>
                          {TEAM_LIST.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={handleTeamSave}
                            className="bg-white text-red-600 text-[10px] px-2 py-1 rounded font-bold"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setIsEditingTeam(false)}
                            className="bg-red-800 text-white text-[10px] px-2 py-1 rounded"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          if (user.my_team) return;
                          setSelectedTeam("");
                          setIsEditingTeam(true);
                        }}
                        className={`flex flex-col items-center transition-transform ${
                          !user.my_team ? "cursor-pointer hover:scale-105" : "cursor-default"
                        }`}
                      >
                        {user.my_team ? (
                          <>
                            <div className="w-8 h-8 relative mb-1">
                              <Image
                                src={getTeamEmblem(user.my_team)}
                                alt={user.my_team}
                                fill
                                className="object-contain"
                              />
                            </div>
                            <span className="font-bold">{user.my_team}</span>
                            <span className="text-[10px] text-rose-200 mt-1">변경 불가</span>
                          </>
                        ) : (
                          <span className="text-sm opacity-50">선택하기 +</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Item 2: Title */}
                  <div
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] cursor-pointer hover:bg-white/20 transition-colors relative"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <span className="text-xs text-red-100 mb-1">칭호</span>
                    <span className="text-2xl">🏅</span>
                    <span className="font-bold text-sm mt-1">{user.title || "신입 메이트"}</span>
                    <button className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 rounded-full hover:bg-white/30">
                      변경
                    </button>
                  </div>

                  {/* Item 3: Win Rate */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
                    <span className="text-xs text-red-100 mb-1">직관 승률</span>
                    <span className="text-xl font-bold">{user.win_rate || 0}%</span>
                    <span className="text-[10px] opacity-60">
                      {user.win_count || 0}승 {user.loss_count || 0}패
                    </span>
                  </div>

                  {/* Item 4: Total Visits */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px]">
                    <span className="text-xs text-red-100 mb-1">직관 횟수</span>
                    <span className="text-xl font-bold">{user.total_visits || 0}회</span>
                    <span className="text-[10px] opacity-60">이번 시즌</span>
                  </div>
                </div>

                {/* Cheering Styles Row */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-red-100">나의 응원 스타일</span>
                    {!isEditingStyles && (
                      <button
                        onClick={() => setIsEditingStyles(true)}
                        className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors"
                      >
                        수정
                      </button>
                    )}
                  </div>

                  {isEditingStyles ? (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-wrap gap-2">
                        {CHEERING_STYLES.map((style) => (
                          <button
                            key={style}
                            onClick={() => handleStyleToggle(style)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                              selectedStyles.includes(style)
                                ? "bg-white text-red-600 border-white font-bold shadow-md transform scale-105"
                                : "bg-transparent text-white/70 border-white/30 hover:bg-white/10"
                            }`}
                          >
                            {style}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            setIsEditingStyles(false);
                            setSelectedStyles(user.cheering_styles || []);
                          }}
                          className="text-xs text-red-200 hover:text-white px-3 py-1"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleStyleSave}
                          className="bg-white text-red-600 text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm hover:bg-red-50"
                        >
                          저장 완료
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.cheering_styles && user.cheering_styles.length > 0 ? (
                        user.cheering_styles.map((style: string) => (
                          <span
                            key={style}
                            className="text-sm px-3 py-1.5 bg-red-800/40 rounded-full text-white border border-red-400/30 flex items-center gap-1"
                          >
                            {style}
                          </span>
                        ))
                      ) : (
                        <span
                          className="text-sm text-red-200 opacity-60 cursor-pointer hover:underline"
                          onClick={() => setIsEditingStyles(true)}
                        >
                          #아직_스타일이_없어요 😅
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: My Rooms (List) */}
        <div className="md:col-span-4 lg:col-span-4 flex flex-col">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            📂 내 채팅방
            <span className="text-xs font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
              {myRooms.length}
            </span>
          </h3>

          <div className="flex-1 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[200px] overflow-y-auto max-h-[400px]">
            {myRooms.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 gap-2">
                <span className="text-2xl">💬</span>
                <p>참여 중인 채팅방이 없습니다.</p>
                <Link href="/" className="text-blue-500 text-sm hover:underline">
                  경기 보러가기
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myRooms.map((room) => (
                  <Link key={room.id} href={`/rooms/${room.id}`}>
                    <div className="p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-400">
                            {room.match_date
                              ? format(new Date(room.match_date), "MM.dd (EEE) HH:mm", { locale: ko })
                              : "일정 미정"}
                          </span>
                          {/* Team Match Info */}
                          {room.home_team && room.away_team ? (
                            <div className="flex items-center gap-1 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                              <span
                                className={
                                  user.my_team?.replace(/\((배구|농구)\)/, "").trim() === room.home_team
                                    ? "text-red-600"
                                    : ""
                                }
                              >
                                {room.home_team}
                              </span>
                              <span className="text-zinc-400 text-[10px]">vs</span>
                              <span
                                className={
                                  user.my_team?.replace(/\((배구|농구)\)/, "").trim() === room.away_team
                                    ? "text-red-600"
                                    : ""
                                }
                              >
                                {room.away_team}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500">{room.location}</span>
                          )}
                        </div>

                        {room.title !== "OFFICIAL_CHAT" && (
                          <span className="text-[10px] text-zinc-500 font-medium bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                            👤 {room.current_count}/{room.max_count}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded shrink-0">
                          {room.title === "OFFICIAL_CHAT" ? "공식" : "직관"}
                        </div>
                        {room.role === "HOST" && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded shrink-0 border border-red-200 dark:border-red-800">
                            👑 방장
                          </span>
                        )}
                        {room.role === "GUEST" && (
                          <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded shrink-0">
                            참여
                          </span>
                        )}
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-0 group-hover:text-blue-600 transition-colors line-clamp-1 text-sm">
                          {room.title}
                        </h4>
                        {room.unread_count && room.unread_count > 0 ? (
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" />
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Team Schedule */}
      <div className="container mx-auto px-4 mt-2" id="team-selection-area">
        <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">🎯 {user.my_team ? `${user.my_team} 경기 일정` : "경기 일정"}</span>
          {user.my_team && (
            <Link
              href="/certification"
              className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              📅 직관 인증 캘린더 보기 <span className="text-[10px]">▶</span>
            </Link>
          )}
        </h3>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {!user.my_team ? (
            <div className="p-10 text-center text-zinc-400">
              <p className="mb-2">응원하는 팀을 선택하면 경기 일정이 표시됩니다.</p>
              <button
                onClick={() => {
                  setIsEditingTeam(true);
                }}
                className="text-white bg-red-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600"
              >
                팀 선택하러 가기
              </button>
            </div>
          ) : teamMatches.length === 0 ? (
            <div className="p-10 text-center text-zinc-400">
              <p>예정된 경기가 없습니다.</p>
            </div>
          ) : (
            <div className="relative group/schedule">
              {/* Left Button (Desktop Only) */}
              <button
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover/schedule:opacity-100 transition-opacity hover:bg-zinc-50"
              >
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Button (Desktop Only) */}
              <button
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-50 w-8 h-8 items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 opacity-0 group-hover/schedule:opacity-100 transition-opacity hover:bg-zinc-50"
              >
                <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div
                ref={scrollRef}
                className="overflow-x-auto scrollbar-hide flex p-4 gap-4 no-scrollbar snap-x snap-mandatory touch-pan-x"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {teamMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/match/${match.id}`}
                    className="min-w-[200px] md:min-w-[240px] snap-center"
                  >
                    <div className="bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-600 hover:border-red-400 dark:hover:border-red-600 transition-colors h-full flex flex-col items-center justify-between relative cursor-pointer group shadow-sm">
                      {/* Top: Date & Location */}
                      <div className="text-center mb-6 w-full pt-2">
                        <div className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">
                          {format(new Date(match.match_date), "yyyy.MM.dd (EEE) HH:mm", { locale: ko })}
                        </div>
                        <div className="text-sm text-zinc-500 font-medium tracking-tight">
                          {match.location || "경기장 미정"}
                        </div>
                      </div>

                      {/* Center: Emblems & VS */}
                      <div className="flex items-center justify-center gap-6 w-full mb-8">
                        {/* Home */}
                        <div className="flex flex-col items-center gap-3 flex-1">
                          <div className="w-16 h-16 relative">
                            <Image
                              src={getTeamEmblem(match.home_team)}
                              alt={match.home_team}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center break-keep">
                            {match.home_team}
                          </span>
                        </div>

                        {/* VS */}
                        <div className="text-sm font-bold text-zinc-300 italic">VS</div>

                        {/* Away */}
                        <div className="flex flex-col items-center gap-3 flex-1">
                          <div className="w-16 h-16 relative">
                            <Image
                              src={getTeamEmblem(match.away_team)}
                              alt={match.away_team}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 text-center break-keep">
                            {match.away_team}
                          </span>
                        </div>
                      </div>

                      {/* Removed Button, just cleaner card */}
                      <div className="w-full text-center pb-2">
                        <span className="text-xs text-zinc-400 group-hover:text-red-500 transition-colors font-medium border-b border-transparent group-hover:border-red-500">
                          경기 상세 보기 &gt;
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title Selection Modal */}
      {isEditingTitle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsEditingTitle(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-center">칭호 선택</h3>
            <p className="text-sm text-zinc-500 text-center mb-6">해금된 칭호를 선택하여 프로필에 표시해보세요!</p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {TITLES.map((t) => {
                const isUnlocked = user.unlocked_titles?.some((ut) => ut.id === t.id);
                const isEquipped = user.title === t.name;

                return (
                  <button
                    key={t.id}
                    disabled={!isUnlocked}
                    onClick={() => handleTitleSelect(t.name)}
                    className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all text-left ${
                      isEquipped
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500"
                        : isUnlocked
                        ? "border-zinc-200 dark:border-zinc-700 hover:border-red-300 hover:bg-red-50/50"
                        : "border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-bold ${isUnlocked ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400"}`}
                        >
                          {t.name}
                        </span>
                        {isEquipped && (
                          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                            장착 중
                          </span>
                        )}
                        {!isUnlocked && (
                          <span className="text-[10px] bg-zinc-200 text-zinc-500 px-1.5 py-0.5 rounded">잠김</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{t.description}</p>
                      {!isUnlocked && (
                        <p className="text-[10px] text-red-400 mt-1 font-medium">🔓 해금 조건: {t.condition}</p>
                      )}
                    </div>
                    {isUnlocked && (
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isEquipped ? "border-red-500" : "border-zinc-300"
                        }`}
                      >
                        {isEquipped && <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsEditingTitle(false)}
              className="mt-6 w-full py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
