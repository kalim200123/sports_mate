"use client";

import { useEffect, useState } from "react";
import CheeringChat from "./CheeringChat";
import MatchingRoomList from "./MatchingRoomList";

interface MatchDetailContentProps {
  matchId: number;
}

export default function MatchDetailContent({ matchId }: MatchDetailContentProps) {
  const [activeTab, setActiveTab] = useState<"MATCHING" | "CHAT">("MATCHING");
  const [roomId, setRoomId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRoomId = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}/chat-room`);
        const data = await res.json();
        if (data.success) {
          setRoomId(data.roomId);
        }
      } catch (error) {
        console.error("Failed to fetch match room:", error);
      }
    };
    fetchRoomId();
  }, [matchId]);

  const ChatComponent = roomId ? (
    <CheeringChat roomId={String(roomId)} />
  ) : (
    <div className="flex h-full items-center justify-center text-zinc-400">채팅방 연결 중...</div>
  );

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 md:py-8 flex-1">
      {/* Tab Navigation */}
      <div className="flex flex-col h-full gap-4">
        <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex gap-1">
          <button
            onClick={() => setActiveTab("MATCHING")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "MATCHING"
                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            직관 메이트 🤝
          </button>
          <button
            onClick={() => setActiveTab("CHAT")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "CHAT"
                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            실시간 응원톡 🔥
          </button>
        </div>

        <div className="flex-1 min-h-[500px]">
          {activeTab === "MATCHING" ? <MatchingRoomList matchId={matchId} /> : ChatComponent}
        </div>
      </div>
    </div>
  );
}
