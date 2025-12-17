import { ChatService } from "@/services/chat.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/rooms/{id}/messages:
 *   get:
 *     summary: 채팅방 메시지 내역 조회
 *     description: 특정 채팅방의 과거 메시지 내역을 조회합니다. 사용자 정보(닉네임, 아바타)가 포함됩니다.
 *     tags:
 *       - Rooms (채팅방)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 채팅방 ID
 *     responses:
 *       200:
 *         description: 메시지 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       content:
 *                         type: string
 *                       nickname:
 *                         type: string
 *                       avatar_url:
 *                         type: string
 *       400:
 *         description: 잘못된 채팅방 ID
 *       500:
 *         description: 서버 내부 오류
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Updated for Next.js 15+ async params
) {
  try {
    const { id } = await params;
    const roomId = parseInt(id, 10);

    if (isNaN(roomId)) {
      return NextResponse.json({ success: false, error: "Invalid Room ID" }, { status: 400 });
    }

    // Fetch messages with user info
    const messages = await ChatService.getRoomMessages(roomId);
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
