"use client";

import { useState } from "react";
import MatchingRoomList from "./MatchingRoomList";
import CheeringChat from "./CheeringChat";

export default function MatchDetailContent() {
  const [activeTab, setActiveTab] = useState<"MATCHING" | "CHAT">("MATCHING");

  return (
    <div className="max-w-5xl mx-auto w-full px-4 py-6 md:py-8 flex-1">
      {/* Mobile Layout: Tabs */}
      <div className="md:hidden flex flex-col h-full gap-4">
        <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex gap-1">
          <button
            onClick={() => setActiveTab("MATCHING")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "MATCHING"
                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            직관 메이트
          </button>
          <button
            onClick={() => setActiveTab("CHAT")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
              activeTab === "CHAT"
                ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            응원톡
          </button>
        </div>

        <div className="flex-1">
          {activeTab === "MATCHING" ? <MatchingRoomList /> : <CheeringChat />}
        </div>
      </div>

      {/* Desktop Layout: Grid (Always Show Both) */}
      <div className="hidden md:grid grid-cols-12 gap-6 h-[600px]">
        {/* Left: Matching Rooms */}
        <div className="col-span-7 h-full">
          <MatchingRoomList />
        </div>

        {/* Right: Cheering Chat */}
        <div className="col-span-5 h-full">
          <div className="sticky top-24 h-full">
            <CheeringChat />
          </div>
        </div>
      </div>
    </div>
  );
}
