import { RoomService } from "@/services/room.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: List matching rooms
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: query
 *         name: match_id
 *         schema:
 *           type: integer
 *         description: Filter by match ID
 *     responses:
 *       200:
 *         description: List of rooms
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
 *                       title:
 *                         type: string
 *                       location:
 *                         type: string
 *                       current_count:
 *                         type: integer
 *                       max_count:
 *                         type: integer
 *       500:
 *         description: Server Error
 */
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

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - match_id
 *               - host_id
 *               - title
 *             properties:
 *               match_id:
 *                 type: integer
 *               host_id:
 *                 type: integer
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               location:
 *                 type: string
 *               max_count:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Room created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 roomId:
 *                   type: integer
 *       500:
 *         description: Server Error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate body...

    // Call Service
    // Call Service
    const roomId = await RoomService.createRoom({
      ...body,
      status: "OPEN",
    });

    return NextResponse.json({ success: true, roomId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create room:", error);
    return NextResponse.json({ success: false, error: "Failed to create room" }, { status: 500 });
  }
}
