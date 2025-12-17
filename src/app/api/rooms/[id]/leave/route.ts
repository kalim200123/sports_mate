import { RoomService } from "@/services/room.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = Number(id);
    const body = await request.json();
    const { userId } = body;

    // TODO: Validate if request sender is the user or add auth check

    await RoomService.leaveRoom(roomId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to leave room:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
