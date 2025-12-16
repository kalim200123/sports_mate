import pool from "@/lib/db";
import { Room } from "@/types/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class RoomService {
  /**
   * 모든 방 목록 조회 (샘플)
   * 비즈니스 로직은 여기서 처리 (DB 조회, 데이터 가공 등)
   */
  static async getRooms(matchId?: number): Promise<Room[]> {
    let query = `
      SELECT r.*, m.home_team, m.away_team,
             (SELECT COUNT(*) FROM user_rooms ur WHERE ur.room_id = r.id AND ur.status = 'JOINED') as current_count
      FROM rooms r
      JOIN matches m ON r.match_id = m.id
      WHERE r.deleted_at IS NULL AND r.title != 'OFFICIAL_CHAT'
    `;
    const params: (string | number)[] = [];

    if (matchId) {
      query += ` AND r.match_id = ?`;
      params.push(matchId);
    }

    query += ` ORDER BY r.created_at DESC LIMIT 20`;

    try {
      const [rows] = await pool.query<RowDataPacket[]>(query, params);
      return rows as Room[];
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      throw new Error("Database query failed");
    }
  }

  /**
   * 방 생성 (트랜잭션: 방 생성 + 방장 참여)
   */
  static async createRoom(data: Partial<Room> & { match_id: number; host_id: number }): Promise<number> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. 방 생성
      const [roomResult] = await connection.query<ResultSetHeader>("INSERT INTO rooms SET ?", data);
      const roomId = roomResult.insertId;

      // 2. 방장 참여 (status = 'JOINED', role = 'HOST')
      await connection.query(
        `INSERT INTO user_rooms (user_id, room_id, status, role, joined_at) VALUES (?, ?, 'JOINED', 'HOST', NOW())`,
        [data.host_id, roomId]
      );

      await connection.commit();
      return roomId;
    } catch (error) {
      await connection.rollback();
      console.error("Failed to create room:", error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 단일 방 상세 조회 (참여자 수 포함)
   */
  static async getRoomDetail(
    roomId: number
  ): Promise<(Room & { current_count: number; joined_users: { nickname: string; avatar_url: string }[] }) | null> {
    const query = `
      SELECT r.*,
             (SELECT COUNT(*) FROM user_rooms ur WHERE ur.room_id = r.id AND ur.status = 'JOINED') as current_count
      FROM rooms r
      WHERE r.id = ? AND r.deleted_at IS NULL
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [roomId]);

    if (!rows[0]) return null;

    // Fetch joined users
    const userQuery = `
      SELECT u.nickname, u.avatar_id
      FROM user_rooms ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.room_id = ? AND ur.status = 'JOINED'
    `;
    const [userRows] = await pool.query<RowDataPacket[]>(userQuery, [roomId]);

    // Map avatar_id to url is needed, but for now just pass data.
    // Wait, getAvatarUrl is in lib/utils or socket-server.
    // We should probably rely on client to format or map it here if we have access to utils.
    // Let's assume client handles avatar or we simple return nickname.
    // Requirement is "Show nicknames".

    return {
      ...(rows[0] as Room),
      current_count: rows[0].current_count,
      joined_users: userRows.map((u) => ({ nickname: u.nickname, avatar_url: `/avatars/${u.avatar_id}.png` })), // Simple mapping
    };
  }
  /**
   * 사용자 승인 (status = 'JOINED')
   */
  static async approveUser(roomId: number, userId: number): Promise<void> {
    await pool.query(
      "UPDATE user_rooms SET status = 'JOINED', decided_at = NOW(), joined_at = NOW() WHERE user_id = ? AND room_id = ?",
      [userId, roomId]
    );
  }
}
