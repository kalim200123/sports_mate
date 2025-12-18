"use client";

import { getTeamEmblem } from "@/lib/utils";
import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { useRef, useState } from "react";

interface Match {
  id: number;
  match_date: Date | string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  status?: string;
  location?: string;
}

interface Certification {
  match_id: number;
  image_url: string;
  match_date: Date | string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  content?: string;
}

interface StampCalendarProps {
  myTeam: string;
  matches: Match[]; // Team Schedule
  certifications: Certification[]; // User Certifications
}

export function StampCalendar({ myTeam, matches, certifications }: StampCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Logic: Strip suffix for comparisons with DB Match Team Names
  const pureMyTeam = myTeam.replace(/\((배구|농구)\)/, "").trim();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // Global Stats (Calculated from all available data, not just current month)
  const validMatches = matches.filter((m) => m.status === "ENDED" || m.status === "COMPLETED");
  const attendedMatches = validMatches.filter((m) =>
    certifications.some((c) => Number(c.match_id) === Number(m.id) && c.status === "APPROVED")
  );
  const totalVisits = attendedMatches.length;

  const totalWins = attendedMatches.filter((m) => {
    const isHome = m.home_team.trim() === pureMyTeam;
    const isAway = m.away_team.trim() === pureMyTeam;

    if (!isHome && !isAway) return false;

    return isHome ? m.home_score > m.away_score : m.away_score > m.home_score;
  }).length;

  const totalWinRate = attendedMatches.length > 0 ? Math.round((totalWins / attendedMatches.length) * 100) : 0;

  // History List (Past matches - Attended Only)
  const myAttendedHistory = matches
    .filter((m) => {
      const isEnded = m.status === "ENDED" || m.status === "COMPLETED";
      const isAttended = certifications.some((c) => Number(c.match_id) === Number(m.id) && c.status === "APPROVED");
      return isEnded && isAttended;
    })
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  // Interactions
  const handleDayClick = (match: Match | undefined, cert: Certification | undefined) => {
    if (!match) return;

    setSelectedMatch(match);
    setSelectedCert(cert || null);

    // If cert exists, preload data
    if (cert) {
      setPreviewUrl(cert.image_url);
      setContent(cert.content || "");
    } else {
      setPreviewUrl(null);
      setContent("");
    }

    setIsModalOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate size (e.g. 5MB)
      if (file.size > 5 * 1024 * 1024) return alert("이미지 크기는 5MB 이하여야 합니다.");

      const formData = new FormData();
      formData.append("file", file);

      setUploading(true);
      try {
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          setPreviewUrl(uploadData.url);
        } else {
          alert("이미지 업로드 실패: " + uploadData.error);
        }
      } catch (err) {
        console.error(err);
        alert("업로드 중 오류가 발생했습니다.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedMatch) return;
    if (!previewUrl) return alert("직관 인증 사진을 올려주세요!");

    setUploading(true);
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: previewUrl,
          content: content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("직관 인증이 요청되었습니다.\n관리자 승인 후 스탬프가 발급됩니다.");
        setIsModalOpen(false);
        // Page reload to refresh data implies we should use router.refresh() or passed refetch function
        window.location.reload();
      } else {
        alert("요청 실패: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* LEFT: Calendar (Compact, Reduced size) */}
      <div className="flex-1 bg-white dark:bg-zinc-900 rounded-3xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 h-fit">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="text-base">{format(currentDate, "yyyy.MM", { locale: ko })}</span>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[10px] font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              오늘
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div
              key={d}
              className={`text-center text-[10px] font-bold py-1 ${i === 0 ? "text-red-500" : "text-zinc-500"}`}
            >
              {d}
            </div>
          ))}

          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {days.map((day) => {
            const dayMatch = matches.find((m) => isSameDay(new Date(m.match_date), day));
            // Check for ANY cert (APPROVED or PENDING) to show status
            const cert = certifications.find((c) => isSameDay(new Date(c.match_date), day));
            const isApproved = cert?.status === "APPROVED";
            const isPending = cert?.status === "PENDING";

            let result = "NONE";
            let resultText = "";
            if (dayMatch && (dayMatch.status === "ENDED" || dayMatch.status === "COMPLETED")) {
              const MyScore = dayMatch.home_team.trim() === pureMyTeam ? dayMatch.home_score : dayMatch.away_score;
              const OpScore = dayMatch.home_team.trim() === pureMyTeam ? dayMatch.away_score : dayMatch.home_score;
              if (MyScore > OpScore) result = "WIN";
              else if (MyScore < OpScore) result = "LOSE";

              resultText = `${MyScore}:${OpScore}`;
            }

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDayClick(dayMatch, cert)}
                className={`aspect-square rounded-lg border relative flex flex-col items-center justify-start py-1 overflow-hidden transition-all
                  ${
                    isSameDay(day, new Date())
                      ? "bg-blue-50/50 border-blue-200"
                      : "bg-transparent border-zinc-50 dark:border-zinc-800"
                  }
                  ${dayMatch ? "hover:border-red-400 cursor-pointer hover:bg-red-50/10" : ""}
                `}
              >
                <span
                  className={`text-[9px] w-full text-right px-1 mb-0.5 ${
                    day.getDay() === 0 ? "text-red-500" : "text-zinc-400"
                  }`}
                >
                  {day.getDate()}
                </span>

                {dayMatch && (
                  <div className="flex flex-col items-center justify-center w-full h-full pb-1 gap-1 relative z-0">
                    {/* Opponent Logo - Larger and Faded Background Effect */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      {/* Optionally add a very large faded logo here if desired, but user just said "fill the cell" */}
                    </div>

                    {/* Main Content */}
                    <div className="w-10 h-10 md:w-14 md:h-14 relative opacity-80">
                      <Image
                        src={getTeamEmblem(
                          dayMatch.home_team.trim() === pureMyTeam ? dayMatch.away_team : dayMatch.home_team
                        )}
                        alt="opponent"
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Result or Time - Larger Text */}
                    <div className="flex flex-col items-center leading-none z-10 w-full">
                      {/* If pending, show Waiting icon */}
                      {isPending && <span className="text-[9px] text-orange-500 font-bold mb-0.5">심사중</span>}

                      <span
                        className={`text-xs md:text-sm font-black leading-tight ${
                          result === "WIN" ? "text-red-500" : result === "LOSE" ? "text-zinc-400" : "text-zinc-800"
                        }`}
                      >
                        {result === "WIN"
                          ? "WIN"
                          : result === "LOSE"
                          ? "LOSE"
                          : format(new Date(dayMatch.match_date), "HH:mm")}
                      </span>
                      {(result === "WIN" || result === "LOSE") && (
                        <span className="text-[10px] md:text-xs text-zinc-500 font-bold mt-0.5">{resultText}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stamp Overlay (Approved Only) - Larger */}
                {isApproved && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20 dark:bg-black/10 backdrop-blur-[0px] rounded-lg animate-in zoom-in duration-300 z-10 pointer-events-none">
                    <div className="relative w-12 h-12 md:w-16 md:h-16 transform rotate-[-12deg] drop-shadow-lg opacity-90">
                      <div className="absolute inset-0 border-[4px] border-red-600 rounded-full" />
                      <Image src={getTeamEmblem(myTeam)} alt="Stamp" fill className="object-contain p-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Stats & History */}
      <div className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
        {/* Stats Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <h4 className="text-sm font-bold text-zinc-500 mb-4 flex items-center gap-2">
            📊 직관 요약
            <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">All Time</span>
          </h4>
          <div className="flex items-center justify-between text-center px-4">
            <div>
              <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-1">{totalVisits}</div>
              <div className="text-xs text-zinc-400 font-medium">총 직관 횟수</div>
            </div>
            <div className="w-px h-10 bg-zinc-100 dark:bg-zinc-800" />
            <div>
              <div className="text-3xl font-black text-red-500 mb-1">{totalWinRate}%</div>
              <div className="text-xs text-zinc-400 font-medium">직관 승률</div>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[300px]">
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900">
            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
              내 직관 기록 <span className="text-zinc-400 text-xs font-normal">({myAttendedHistory.length})</span>
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {/* List Logic Same as before */}
            {myAttendedHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs">
                인증된 직관 기록이 없습니다.
              </div>
            ) : (
              myAttendedHistory.map((match) => {
                let result = "NONE";
                if (match.status === "ENDED" || match.status === "COMPLETED") {
                  const isHome = match.home_team.trim() === pureMyTeam;
                  const myScore = isHome ? match.home_score : match.away_score;
                  const opScore = isHome ? match.away_score : match.home_score;
                  if (myScore > opScore) result = "WIN";
                  else if (myScore < opScore) result = "LOSE";
                }
                return (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 rounded-2xl hover:border-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm ${
                          result === "WIN"
                            ? "bg-red-50 text-red-600 border border-red-100"
                            : result === "LOSE"
                            ? "bg-zinc-100 text-zinc-500 border border-zinc-200"
                            : "bg-blue-50 text-blue-500"
                        }`}
                      >
                        {result === "WIN" ? "WIN" : result === "LOSE" ? "LOSE" : "-"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {format(new Date(match.match_date), "yy.MM.dd")} (직관)
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            vs {match.home_team === pureMyTeam ? match.away_team : match.home_team}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {isModalOpen && selectedMatch && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>

            <h3 className="text-lg font-bold mb-1 text-center">직관 기록장 ✏️</h3>
            <p className="text-xs text-zinc-500 text-center mb-6">
              {format(new Date(selectedMatch.match_date), "MM월 dd일")} vs{" "}
              {selectedMatch.home_team === pureMyTeam ? selectedMatch.away_team : selectedMatch.home_team}
            </p>

            {/* Photo Upload Area */}
            <div
              className="w-full aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-400 cursor-pointer transition-colors group"
              onClick={() => !selectedCert && fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <Image src={previewUrl} alt="preview" fill className="object-cover" />
              ) : (
                <div className="text-center text-zinc-400 group-hover:text-blue-500 transition-colors">
                  <span className="text-2xl block mb-1">📸</span>
                  <span className="text-xs">인증샷 올리기</span>
                </div>
              )}
              {!selectedCert && (
                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
              )}
            </div>

            {/* Content Area */}
            <div className="mb-4">
              <textarea
                className="w-full h-24 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                placeholder="오늘 경기는 어땠나요? 간단한 기록을 남겨보세요! (선수 플레이 감상, 경기장 분위기 등)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                readOnly={!!selectedCert && selectedCert.status !== "REJECTED"} // Editable only if not submitted or rejected? User implies viewing record.
              />
            </div>

            {/* Status or Buttons */}
            {selectedCert ? (
              <div className="w-full text-center">
                {selectedCert.status === "APPROVED" && (
                  <div className="py-3 bg-green-50 text-green-600 rounded-xl font-bold text-sm">
                    ✅ 인증 완료된 기록입니다
                  </div>
                )}
                {selectedCert.status === "PENDING" && (
                  <div className="py-3 bg-yellow-50 text-yellow-600 rounded-xl font-bold text-sm">
                    ⏳ 관리자 승인 대기중입니다
                  </div>
                )}
                {selectedCert.status === "REJECTED" && (
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    {uploading ? "업로드 중..." : "다시 제출하기"}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
              >
                {uploading ? "기록 저장 중..." : "기록 저장하기"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
