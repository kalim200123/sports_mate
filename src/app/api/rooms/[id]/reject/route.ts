import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * POST /api/rooms/:roomId/reject
 * 방장이 대기 중인 신청자를 거절합니다.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = parseInt(params.id);
    const { userId: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // 1. 방장 확인
    const [roomRows] = await pool.query<RowDataPacket[]>("SELECT host_id FROM rooms WHERE id = ?", [roomId]);
    const room = roomRows[0];

    if (!room || room.host_id !== Number(session.user.id)) {
      return NextResponse.json({ error: "Only host can reject" }, { status: 403 });
    }

    // 2. 대기자 상태 확인 및 거절 처리
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE user_rooms 
       SET status = 'REJECTED', decided_at = NOW() 
       WHERE room_id = ? AND user_id = ? AND status = 'PENDING'`,
      [roomId, targetUserId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "User not in pending status" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reject Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
