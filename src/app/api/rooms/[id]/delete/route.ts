import { RoomService } from "@/services/room.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = Number(id);

    // TODO: Add Auth check (Host only) - Currently handled by frontend checking user ID against host ID,
    // but ideally should be checked here via session. Assuming trusted frontend for MVP or adding session check later.

    await RoomService.deleteRoom(roomId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete room:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
