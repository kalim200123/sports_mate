import pool from "@/lib/db";
import { TicketAuth } from "@/types/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class TicketService {
  /**
   * 직관 인증 요청 생성
   */
  static async createAuth(data: { userId: number; matchId: number; imageUrl: string }): Promise<number> {
    // Upsert logic: If exists, update image and set status to PENDING
    const query = `
      INSERT INTO ticket_auths (user_id, match_id, image_url, status)
      VALUES (?, ?, ?, 'PENDING')
      ON DUPLICATE KEY UPDATE
      image_url = VALUES(image_url),
      status = 'PENDING',
      updated_at = CURRENT_TIMESTAMP
    `;
    const [result] = await pool.query<ResultSetHeader>(query, [data.userId, data.matchId, data.imageUrl]);
    return result.insertId;
  }

  /**
   * 특정 경기 인증 상태 조회
   */
  static async getAuthStatus(userId: number, matchId: number): Promise<TicketAuth | null> {
    const query = `SELECT * FROM ticket_auths WHERE user_id = ? AND match_id = ?`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [userId, matchId]);
    return (rows[0] as TicketAuth) || null;
  }

  /**
   * 관리자: 대기 중인 인증 목록 조회 (최신순)
   */
  static async getPendingAuths(): Promise<
    (TicketAuth & { user_nickname: string; match_title: string; match_date: Date })[]
  > {
    const query = `
      SELECT ta.*, u.nickname as user_nickname, 
             CONCAT(m.home_team, ' vs ', m.away_team) as match_title,
             m.match_date
      FROM ticket_auths ta
      JOIN users u ON ta.user_id = u.id
      JOIN matches m ON ta.match_id = m.id
      WHERE ta.status = 'PENDING'
      ORDER BY ta.created_at ASC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as (TicketAuth & { user_nickname: string; match_title: string; match_date: Date })[];
  }

  /**
   * 관리자: 인증 승인 및 승률/직관수 업데이트
   */
  static async approveAuth(authId: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Approve
      await connection.query(`UPDATE ticket_auths SET status = 'APPROVED' WHERE id = ?`, [authId]);

      // 2. Get User ID
      const [authRows] = await connection.query<RowDataPacket[]>(`SELECT user_id FROM ticket_auths WHERE id = ?`, [
        authId,
      ]);
      if (authRows.length === 0) throw new Error("Auth not found");
      const userId = authRows[0].user_id;

      // 3. Recalculate Stats
      // Count total approved visits
      const [visitRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(*) as count FROM ticket_auths WHERE user_id = ? AND status = 'APPROVED'`,
        [userId]
      );
      const totalVisits = visitRows[0].count;

      // Calculate Win Rate based on Matches linked to Approved Auths
      // Condition: User's team (my_team) won? Or simply Home team won if home_score > away_score?
      // Logic: Let's assume user supports '정관장' (Red Sparks) as per MVP.
      // Or we check `users.my_team`.
      const [userRows] = await connection.query<RowDataPacket[]>(`SELECT my_team FROM users WHERE id = ?`, [userId]);
      const myTeam = userRows[0].my_team || "정관장"; // Default

      const [winRows] = await connection.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) as win_count
        FROM ticket_auths ta
        JOIN matches m ON ta.match_id = m.id
        WHERE ta.user_id = ? AND ta.status = 'APPROVED'
          AND m.status IN ('ENDED', 'COMPLETED')
          AND (
            (m.home_team = ? AND m.home_score > m.away_score)
            OR
            (m.away_team = ? AND m.away_score > m.home_score)
          )
        `,
        [userId, myTeam, myTeam]
      );
      const winCount = winRows[0].win_count;

      // Calculate Rate: (Wins / Total Ended Visits) * 100
      // We need total visits that are ENDED matches for fair calc.
      const [endedVisitRows] = await connection.query<RowDataPacket[]>(
        `
        SELECT COUNT(*) as count 
        FROM ticket_auths ta
        JOIN matches m ON ta.match_id = m.id
        WHERE ta.user_id = ? AND ta.status = 'APPROVED' AND m.status IN ('ENDED', 'COMPLETED')
        `,
        [userId]
      );
      const endedVisits = endedVisitRows[0].count;

      const winRate = endedVisits > 0 ? Math.round((winCount / endedVisits) * 100) : 0;

      // 4. Update User Profile
      await connection.query(
        `UPDATE users SET total_visits = ?, win_rate = ? , win_count = ?, loss_count = ? WHERE id = ?`,
        [totalVisits, winRate, winCount, endedVisits - winCount, userId]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 사용자 직관 인증 내역 조회 (캘린더용)
   */
  static async getCertifications(userId: number): Promise<
    (TicketAuth & {
      match_date: Date;
      home_team: string;
      away_team: string;
      home_score: number;
      away_score: number;
      match_status: string;
    })[]
  > {
    const query = `
      SELECT ta.*, m.match_date, m.home_team, m.away_team, m.home_score, m.away_score, m.status as match_status
      FROM ticket_auths ta
      JOIN matches m ON ta.match_id = m.id
      WHERE ta.user_id = ? AND ta.status = 'APPROVED'
      ORDER BY m.match_date ASC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [userId]);
    return rows as (TicketAuth & {
      match_date: Date;
      home_team: string;
      away_team: string;
      home_score: number;
      away_score: number;
      match_status: string;
    })[];
  }

  /**
   * 관리자: 인증 거절
   */
  static async rejectAuth(authId: number): Promise<void> {
    await pool.query(`UPDATE ticket_auths SET status = 'REJECTED' WHERE id = ?`, [authId]);
  }
}
