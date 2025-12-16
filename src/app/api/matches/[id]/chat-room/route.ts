import { ChatService } from "@/services/chat.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/matches/{id}/chat-room:
 *   get:
 *     summary: Get or create official chat room for a match
 *     tags:
 *       - Matches
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Successfully retrieved room ID
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
 *         description: Invalid Match ID
 *       500:
 *         description: Server Error
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
