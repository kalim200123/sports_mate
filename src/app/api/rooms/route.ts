import { RoomService } from "@/services/room.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: 채팅방 목록 조회
 *     description: "조건에 맞는 채팅방 목록을 조회합니다. (예: 특정 경기 ID로 필터링)"
 *     tags:
 *       - Rooms (채팅방)
 *     parameters:
 *       - in: query
 *         name: matchId
 *         required: false
 *         schema:
 *           type: integer
 *         description: "경기 ID (입력 시 해당 경기의 채팅방만 조회)"
 *       - in: query
 *         name: status
 *         required: false
 *         schema:
 *           type: string
 *           enum: [OPEN, FULL, CLOSED]
 *         description: "채팅방 상태 (기본값: OPEN)"
 *     responses:
 *       200:
 *         description: 채팅방 목록 조회 성공
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
 *         description: 서버 내부 오류
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get("match_id");
    const sport = searchParams.get("sport");
    const region = searchParams.get("region");

    // Controller: 요청 파싱 및 Service 호출
    const rooms = await RoomService.getRooms({
      matchId: matchId ? Number(matchId) : undefined,
      sport: sport || undefined,
      region: region || undefined,
    });

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
 *     summary: 채팅방 생성
 *     description: 새로운 응원 채팅방 또는 직관 모임방을 생성합니다.
 *     tags:
 *       - Rooms (채팅방)
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
 *                 description: 관련 경기 ID
 *               host_id:
 *                 type: integer
 *                 description: 방장(생성자) 사용자 ID
 *               title:
 *                 type: string
 *                 description: 방 제목
 *               content:
 *                 type: string
 *                 description: 방 소개글 (선택)
 *               location:
 *                 type: string
 *                 description: 모임 장소 (선택, 직관 모임 시)
 *               max_count:
 *                 type: integer
 *                 description: 최대 참여 인원
 *     responses:
 *       201:
 *         description: 채팅방 생성 성공
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
 *         description: 서버 내부 오류
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
