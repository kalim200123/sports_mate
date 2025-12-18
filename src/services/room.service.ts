import pool from "@/lib/db";
import { Room } from "@/types/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class RoomService {
  /**
   * 모든 방 목록 조회 (필터링 지원)
   * 비즈니스 로직은 여기서 처리 (DB 조회, 데이터 가공 등)
   */
  static async getRooms(filters: { matchId?: number; sport?: string; region?: string } = {}): Promise<Room[]> {
    let query = `
      SELECT r.*, m.home_team, m.away_team, m.match_date, m.sport, m.location as match_location,
             (SELECT COUNT(*) FROM user_rooms ur WHERE ur.room_id = r.id AND ur.status = 'JOINED') as current_count
      FROM rooms r
      JOIN matches m ON r.match_id = m.id
      WHERE r.deleted_at IS NULL AND r.title != 'OFFICIAL_CHAT'
    `;
    const params: (string | number)[] = [];

    if (filters.matchId) {
      query += ` AND r.match_id = ?`;
      params.push(filters.matchId);
    }

    if (filters.sport && filters.sport !== "ALL") {
      query += ` AND m.sport = ?`;
      params.push(filters.sport.toUpperCase());
    }

    if (filters.region && filters.region !== "ALL") {
      query += ` AND r.region = ?`;
      params.push(filters.region);
    }

    query += ` ORDER BY r.created_at DESC LIMIT 50`;

    try {
      const [rows] = await pool.query<RowDataPacket[]>(query, params);
      return rows as Room[];
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      throw new Error("Database query failed");
    }
  }

  /**
   * 인기 응원방 조회 (메인 페이지용)
   * 기준: 모집 중인 방, 경기 시간 지나지 않음, 참여자 수 많은 순
   */
  static async getPopularRooms(limit: number = 5): Promise<Room[]> {
    const query = `
      SELECT r.*, m.home_team, m.away_team, m.match_date, m.sport, m.location,
             (SELECT COUNT(*) FROM user_rooms ur WHERE ur.room_id = r.id AND ur.status = 'JOINED') as current_count,
             (SELECT COUNT(*) 
              FROM user_rooms ur 
              WHERE ur.room_id = r.id 
                AND ur.status IN ('PENDING', 'JOINED', 'LEFT', 'KICKED')
             ) as interaction_count
      FROM rooms r
      JOIN matches m ON r.match_id = m.id
      WHERE r.deleted_at IS NULL
        AND r.title != 'OFFICIAL_CHAT'
        AND (r.status = 'OPEN' OR r.status = 'FULL')
        AND m.match_date >= NOW()
      ORDER BY interaction_count DESC, current_count DESC, r.created_at DESC
      LIMIT ?
    `;

    try {
      const [rows] = await pool.query<RowDataPacket[]>(query, [limit]);
      return rows as Room[];
    } catch (error) {
      console.error("Failed to fetch popular rooms:", error);
      return []; // Silently fail for main page widgets
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
      SELECT u.id, u.nickname, u.profile_image_url
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
      joined_users: userRows.map((u) => ({
        userId: u.id,
        nickname: u.nickname,
        avatar_url: u.profile_image_url || "/avatars/1.png",
      })), // Simple mapping
    };
  }
  /**
   * 사용자 승인 (status = 'JOINED') - 자동 상태 업데이트 포함
   */
  static async approveUser(roomId: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Check Capacity FIRST
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT r.max_count, (SELECT COUNT(*) FROM user_rooms WHERE room_id = r.id AND status = 'JOINED') as current_count 
         FROM rooms r WHERE r.id = ? FOR UPDATE`,
        [roomId]
      );

      if (rows.length > 0) {
        const { max_count, current_count } = rows[0];
        if (current_count >= max_count) {
          throw new Error("ROOM_FULL");
        }
      }

      // 2. Approve User
      await connection.query(
        "UPDATE user_rooms SET status = 'JOINED', decided_at = NOW(), joined_at = NOW() WHERE user_id = ? AND room_id = ?",
        [userId, roomId]
      );

      // 3. Re-Check & Update Room Status to FULL if it just became full
      // We increased count by 1 effectively.
      if (rows.length > 0) {
        const { max_count, current_count } = rows[0];
        // current_count was reading BEFORE update. New count is current_count + 1
        if (current_count + 1 >= max_count) {
          await connection.query("UPDATE rooms SET status = 'FULL' WHERE id = ? AND status = 'OPEN'", [roomId]);
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자 강퇴 (status = 'KICKED') - 자동 상태 업데이트 포함
   */
  static async kickUser(roomId: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE user_rooms SET status = 'KICKED', decided_at = NOW(), left_at = NOW() WHERE user_id = ? AND room_id = ?",
        [userId, roomId]
      );

      // Check if room should be OPEN again
      // We don't perform extensive check here for MVP, but logically if it was FULL it might become OPEN.
      // Let's safe-guard: if count < max, set OPEN if currently FULL.
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT r.max_count, r.status, (SELECT COUNT(*) FROM user_rooms WHERE room_id = r.id AND status = 'JOINED') as current_count 
        FROM rooms r WHERE r.id = ? FOR UPDATE`,
        [roomId]
      );

      if (rows.length > 0) {
        const { max_count, current_count, status } = rows[0];
        if (status === "FULL" && current_count < max_count) {
          await connection.query("UPDATE rooms SET status = 'OPEN' WHERE id = ?", [roomId]);
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * 방 나가기 (status = 'LEFT')
   */
  static async leaveRoom(roomId: number, userId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE user_rooms SET status = 'LEFT', left_at = NOW() WHERE user_id = ? AND room_id = ?",
        [userId, roomId]
      );

      // Check Capacity & Update to OPEN if needed
      const [rows] = await connection.query<RowDataPacket[]>(
        `SELECT r.max_count, r.status, (SELECT COUNT(*) FROM user_rooms WHERE room_id = r.id AND status = 'JOINED') as current_count 
         FROM rooms r WHERE r.id = ? FOR UPDATE`,
        [roomId]
      );

      if (rows.length > 0) {
        const { max_count, current_count, status } = rows[0];
        if (status === "FULL" && current_count < max_count) {
          await connection.query("UPDATE rooms SET status = 'OPEN' WHERE id = ?", [roomId]);
        }
      }

      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * 방 모집 종료 (status = 'CLOSED')
   */
  static async closeRoom(roomId: number): Promise<void> {
    await pool.query("UPDATE rooms SET status = 'CLOSED' WHERE id = ?", [roomId]);
  }

  /**
   * 방 삭제 (status = 'DELETED')
   */
  static async deleteRoom(roomId: number): Promise<void> {
    await pool.query("UPDATE rooms SET status = 'DELETED', deleted_at = NOW() WHERE id = ?", [roomId]);
  }

  /**
   * 방 공지(설명) 수정
   */
  static async updateRoomContent(roomId: number, content: string): Promise<void> {
    await pool.query("UPDATE rooms SET content = ? WHERE id = ?", [content, roomId]);
  }

  /**
   * 사용자가 참여 중인 방 목록 조회
   */
  /**
   * 마지막 읽은 시간 업데이트
   */
  static async updateLastReadAt(roomId: number, userId: number): Promise<void> {
    await pool.query("UPDATE user_rooms SET last_read_at = NOW() WHERE user_id = ? AND room_id = ?", [userId, roomId]);
  }

  static async getUserJoinedRooms(userId: number): Promise<Room[]> {
    const query = `
      SELECT r.*, m.home_team, m.away_team, m.match_date, ur.role, ur.last_read_at,
             (SELECT COUNT(*) FROM user_rooms ur2 WHERE ur2.room_id = r.id AND ur2.status = 'JOINED') as current_count,
             (SELECT COUNT(*) FROM room_messages rm WHERE rm.room_id = r.id AND rm.created_at > ur.last_read_at) as unread_count
      FROM user_rooms ur
      JOIN rooms r ON ur.room_id = r.id
      JOIN matches m ON r.match_id = m.id
      WHERE ur.user_id = ? AND ur.status = 'JOINED' AND r.deleted_at IS NULL AND r.title != 'OFFICIAL_CHAT'
      ORDER BY r.created_at DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);
    return rows as Room[];
  }
}
