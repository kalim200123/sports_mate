import { RoomService } from "@/services/room.service";
import { NextResponse } from "next/server";

// GET /api/rooms
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("match_id");

    // Controller: 요청 파싱 및 Service 호출
    const rooms = await RoomService.getRooms(matchId ? Number(matchId) : undefined);

    // Controller: 응답 포맷팅
    return NextResponse.json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch rooms" }, { status: 500 });
  }
}

// POST /api/rooms (예시)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate body...

    // Call Service
    // Call Service
    const roomId = await RoomService.createRoom({
      ...body,
      is_approval_required: body.is_approval_required ?? true, // Default to true
      status: "OPEN",
    });

    return NextResponse.json({ success: true, roomId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json({ success: false, error: "Failed to create room" }, { status: 500 });
  }
}
