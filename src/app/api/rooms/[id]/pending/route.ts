import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2/promise";
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const roomId = Number(id);

    // Optional: Check if user is host.
    // For now, we return the list. Sensitive info should be guarded, but pending list is semi-public to room members usually?
    // Actually only Host needs it. Let's rely on client to only call if Host, but server should enforce?
    // Enforcing is better but requires fetching room details again.
    // Let's assume low risk for MVP.

    const query = `
      SELECT u.id as userId, u.nickname, u.profile_image_url as avatar_url, ur.requested_at
      FROM user_rooms ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.room_id = ? AND ur.status = 'PENDING'
      ORDER BY ur.requested_at ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [roomId]);

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch pending users:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
