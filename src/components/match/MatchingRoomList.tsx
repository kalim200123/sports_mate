import { REGIONS } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreateRoomModal from "./CreateRoomModal";

interface MatchingRoomListProps {
  matchId: number;
}

export default function MatchingRoomList({ matchId }: MatchingRoomListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  // Fetch Rooms
  const fetchRooms = async () => {
    if (!matchId || isNaN(matchId)) return;
    setIsLoading(true);

    try {
      const url = new URL("/api/rooms", window.location.origin);
      url.searchParams.append("match_id", matchId.toString());
      if (selectedRegion !== "ALL") {
        url.searchParams.append("region", selectedRegion);
      }

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        // Filter out OFFICIAL_CHAT
        const filteredRooms = data.data.filter((r: any) => r.title !== "OFFICIAL_CHAT");
        setRooms(filteredRooms);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when filters change
  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, selectedRegion]);

  // Re-fetch when modal closes (or success)
  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchRooms();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm relative">
      <CreateRoomModal isOpen={isModalOpen} onClose={handleModalClose} matchId={matchId} />

      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
        <h2 className="font-bold text-lg hidden md:block">직관 메이트 찾기 🤝</h2>
        <h2 className="font-bold text-lg md:hidden">메이트 🤝</h2>

        <div className="flex gap-2">
          <select
            className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs bg-white dark:bg-zinc-800 focus:outline-none"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="ALL">전체 지역</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            방 만들기
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/30">
        {isLoading ? (
          <div className="text-center py-10 text-zinc-400">Loading...</div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center opacity-60 min-h-[300px]">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-zinc-500 font-medium">아직 생성된 방이 없어요.</p>
            <p className="text-zinc-400 text-sm mt-1">첫 번째 방장이 되어보세요!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => router.push(`/rooms/${room.id}`)}
              className="bg-white dark:bg-zinc-800 p-4 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-md">
                  승인제
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    room.ticket_status === "RESERVED"
                      ? "border-blue-200 text-blue-600 bg-blue-50"
                      : "border-zinc-200 text-zinc-500 bg-zinc-50"
                  }`}
                >
                  {room.ticket_status === "RESERVED" ? "예매완료" : "미예매"}
                </span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-1">{room.title}</h3>
              <p className="text-xs text-zinc-500 mb-3 line-clamp-1">{room.content}</p>

              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  👤{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {room.current_count || 1}/{room.max_count}
                  </span>
                </span>
                {room.region && (
                  <span className="bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-[10px]">
                    📍 {room.region}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
