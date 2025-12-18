import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const roomId = Number(id);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!roomId) {
      return NextResponse.json({ success: false, error: "Invalid Room ID" }, { status: 400 });
    }

    // 1. Get Room Status & Capacity
    const roomQuery = `
      SELECT r.status, r.max_count, m.home_team, m.away_team, m.match_date, m.location,
             (SELECT COUNT(*) FROM user_rooms ur WHERE ur.room_id = r.id AND ur.status = 'JOINED') as current_count
      FROM rooms r
      JOIN matches m ON r.match_id = m.id
      WHERE r.id = ? AND r.deleted_at IS NULL
    `;
    const [roomRows] = await pool.query<RowDataPacket[]>(roomQuery, [roomId]);
    const room = roomRows[0];

    if (!room) {
      return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
    }

    // 2. Get User Status (if userId provided)
    let userStatus = null;
    if (userId) {
      const userQuery = `SELECT status FROM user_rooms WHERE room_id = ? AND user_id = ?`;
      const [userRows] = await pool.query<RowDataPacket[]>(userQuery, [roomId, userId]);
      if (userRows.length > 0) {
        userStatus = userRows[0].status;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        roomStatus: room.status, // OPEN, FULL (derived?), CLOSED
        currentCount: room.current_count,
        maxCount: room.max_count,
        userStatus: userStatus, // JOINED, PENDING, KICKED, LEFT, null
        matchInfo: {
          homeTeam: room.home_team,
          awayTeam: room.away_team,
          matchDate: room.match_date,
          location: room.location,
        },
      },
    });
  } catch (error) {
    console.error("Failed to check membership:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
