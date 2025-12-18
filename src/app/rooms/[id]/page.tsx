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
      <div className="flex-1 p-4 overflow-hidden">
        <CheeringChat
          roomId={String(roomId)}
          hostId={room.host_id}
          initialJoinedUsers={room.joined_users}
          title={room.title}
          roomInfo={{
            ...room,
            content: room.content || "",
            notice: room.notice || undefined,
            region: room.region || undefined,
          }}
        />
      </div>
    </div>
  );
}
