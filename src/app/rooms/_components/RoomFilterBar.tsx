"use client";

import { REGIONS } from "@/lib/constants";
import { Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function RoomFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initial State from URL
  const [sport, setSport] = useState(searchParams.get("sport") || "ALL");
  const [region, setRegion] = useState(searchParams.get("region") || "ALL");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [includePast, setIncludePast] = useState(searchParams.get("includePast") === "true");

  // Update URL function
  const updateFilter = (newParams: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      params.set(key, value);
    });
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-14 md:top-20 z-20 transition-all">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Top Row: Main Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {/* Sport Filter */}
          <select
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            value={sport}
            onChange={(e) => {
              setSport(e.target.value);
              updateFilter({ sport: e.target.value });
            }}
          >
            <option value="ALL">모든 종목</option>
            <option value="VOLLEYBALL">🏐 배구</option>
            <option value="BASKETBALL">🏀 농구</option>
          </select>

          {/* Region Filter */}
          <select
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              updateFilter({ region: e.target.value });
            }}
          >
            <option value="ALL">모든 지역</option>
            {REGIONS.slice(1).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-none text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              updateFilter({ status: e.target.value });
            }}
          >
            <option value="ALL">전체 (모집중+만원)</option>
            <option value="RECRUITING">참여 가능만 (자리 있음)</option>
          </select>
        </div>

        {/* Bottom Row / Side: Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                !includePast ? "bg-blue-600 border-blue-600" : "border-zinc-300 dark:border-zinc-600"
              }`}
            >
              {!includePast && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={!includePast}
              onChange={(e) => {
                const checked = e.target.checked; // checked means "Exclude Past" -> includePast = false
                setIncludePast(!checked);
                updateFilter({ includePast: (!checked).toString() });
              }}
            />
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
              예정된 경기만 보기
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
