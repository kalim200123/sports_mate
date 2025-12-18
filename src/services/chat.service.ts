import pool from "@/lib/db";
import { getAvatarUrl } from "@/lib/utils";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class ChatService {
  /**
   * Get or create the official chat room for a match
   */
  static async getOrCreateMatchRoom(matchId: number): Promise<number> {
    // 1. Check for existing OFFICIAL_CHAT room
    const [existing] = await pool.query<RowDataPacket[]>(
      `
      SELECT id FROM rooms 
      WHERE match_id = ? AND title = 'OFFICIAL_CHAT'
      LIMIT 1
    `,
      [matchId]
    );

    if (existing.length > 0) {
      return existing[0].id;
    }

    // 2. If not exists, create one
    // Fallback host logic
    const [users] = await pool.query<RowDataPacket[]>("SELECT id FROM users LIMIT 1");
    let hostId = 1;
    if (users.length > 0) {
      hostId = users[0].id;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `
      INSERT INTO rooms (match_id, host_id, title, content, max_count, status)
      VALUES (?, ?, 'OFFICIAL_CHAT', '매치 공식 응원방입니다.', 9999, 'OPEN')
    `,
      [matchId, hostId]
    );

    return result.insertId;
  }

  /**
   * Fetch chat messages for a room
   */
  static async getRoomMessages(roomId: number): Promise<
    {
      id: number;
      room_id: number;
      user_id: number;
      content: string;
      created_at: string;
      nickname: string;
      avatar_url: string;
    }[]
  > {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        m.id, 
        m.room_id, 
        m.user_id, 
        m.content, 
        m.created_at,
        u.nickname,
        u.profile_image_url
      FROM room_messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_id = ?
      ORDER BY m.created_at ASC
      LIMIT 100
    `,
      [roomId]
    );

    return rows.map((row) => ({
      id: row.id,
      room_id: row.room_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      nickname: row.nickname,
      avatar_url: row.profile_image_url || getAvatarUrl(0),
    }));
  }
}
