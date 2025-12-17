import { ChatService } from "@/services/chat.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/matches/{id}/chat-room:
 *   get:
 *     summary: 경기 공식 채팅방 조회 (없으면 생성)
 *     tags:
 *       - Matches (경기)
 *     description: 특정 경기의 공식 응원방 ID를 조회합니다. 존재하지 않을 경우 자동으로 생성하여 반환합니다.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 경기(Match) ID
 *     responses:
 *       200:
 *         description: 채팅방 ID 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 roomId:
 *                   type: integer
 *       400:
 *         description: 잘못된 경기 ID
 *       500:
 *         description: 서버 내부 오류
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const matchId = parseInt(id, 10);

    if (isNaN(matchId)) {
      return NextResponse.json({ success: false, error: "Invalid Match ID" }, { status: 400 });
    }

    const roomId = await ChatService.getOrCreateMatchRoom(matchId);
    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    console.error("Error ensuring match room:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
