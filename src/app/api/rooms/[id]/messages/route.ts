import { ChatService } from "@/services/chat.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/rooms/{id}/messages:
 *   get:
 *     summary: Fetch chat history for a room
 *     tags:
 *       - Rooms
 *     description: Returns list of messages with sender info
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     responses:
 *       200:
 *         description: List of messages
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
 *         description: Invalid Room ID
 *       500:
 *         description: Server Error
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
