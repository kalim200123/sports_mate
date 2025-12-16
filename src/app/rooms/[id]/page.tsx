import CheeringChat from "@/components/match/CheeringChat";
import { RoomService } from "@/services/room.service";
import { notFound } from "next/navigation";

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = Number(id);

  if (isNaN(roomId)) notFound();

  const room = await RoomService.getRoomDetail(roomId);

  if (!room) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a
            href={`/match/${room.match_id}`}
            className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </a>
          <div>
            <h1 className="font-bold text-lg">{room.title}</h1>
            <p className="text-xs text-zinc-500">
              {room.max_count}명 중 {room.current_count}명 참여중
            </p>
          </div>
        </div>
        <button className="text-zinc-400 hover:text-zinc-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <CheeringChat roomId={String(roomId)} hostId={room.host_id} initialJoinedUsers={room.joined_users} />
      </div>
    </div>
  );
}
