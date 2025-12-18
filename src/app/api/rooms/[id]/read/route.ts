import { authOptions } from "@/lib/auth";
import { RoomService } from "@/services/room.service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const roomId = Number(id);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await RoomService.updateLastReadAt(roomId, Number(session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Read Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
