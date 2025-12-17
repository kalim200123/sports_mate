import { RoomService } from "@/services/room.service";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = Number(id);
    const body = await request.json();
    const { content } = body;

    await RoomService.updateRoomContent(roomId, content);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update content:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
