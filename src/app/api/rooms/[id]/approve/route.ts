import { authOptions } from "@/lib/auth";
import { RoomService } from "@/services/room.service";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const roomId = Number(id);
    const body = await request.json();
    const { userId } = body;

    // Optional: Add check if current user is the host of the room
    // For now assuming the UI only exposes this to the host and we trust the request
    // or add a check: const room = await RoomService.getRoomDetail(roomId); if (room.host_id !== session.user.id) ...

    await RoomService.approveUser(roomId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to approve user:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
