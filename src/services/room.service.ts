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
      SELECT r.*, m.home_team, m.away_team
      FROM rooms r
      JOIN matches m ON r.match_id = m.id
      WHERE r.deleted_at IS NULL
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
}
