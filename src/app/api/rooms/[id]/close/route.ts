import { RoomService } from "@/services/room.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = Number(id);

    // TODO: Add Auth check (Host only)

    await RoomService.closeRoom(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to close room:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
