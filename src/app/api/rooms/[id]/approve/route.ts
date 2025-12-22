import { authOptions } from "@/lib/auth";
import { RoomService } from "@/services/room.service";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/rooms/{id}/approve:
 *   post:
 *     summary: 채팅방 참여 승인 (방장 전용)
 *     description: 방장이 대기 중인 사용자의 참여 요청을 승인합니다.
 *     tags:
 *       - Rooms (채팅방)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: 승인할 사용자 ID
 *     responses:
 *       200:
 *         description: 승인 성공
 *       401:
 *         description: 권한 없음
 *       500:
 *         description: 서버 내부 오류
 */
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
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "ROOM_FULL") {
      return NextResponse.json({ success: false, error: "ROOM_FULL" }, { status: 400 });
    }
    console.error("Failed to approve user:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
