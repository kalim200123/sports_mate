import { RoomService } from "@/services/room.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // TODO: Use real NextAuth session in production
  // For MVP, we use query param or header, or mock user.
  // Assuming client sends userId in header 'x-user-id' based on previous context,
  // OR we can parse it from user store on client side and pass it.
  // Actually standard way in this app so far: Mock or Session.
  // Let's check how other APIs get user. They mostly trust client to send ID or use mock.
  // Let's look at `createRoom` -> it takes host_id from body.
  // Let's look at `join_room` -> socket event.
  // For this GET request, let's accept `userId` as query param for simplicity in MVP.

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
  }

  try {
    const rooms = await RoomService.getUserJoinedRooms(Number(userId));
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error("Failed to fetch my rooms:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch rooms" }, { status: 500 });
  }
}
