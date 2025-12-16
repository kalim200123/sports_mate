import { MEN_TEAMS, WOMEN_TEAMS } from "@/lib/constants";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export interface Match extends RowDataPacket {
  id: number;
  sport: "VOLLEYBALL" | "BASKETBALL";
  match_date: Date;
  home_team: string;
  away_team: string;
  location: string;
  home_score: number;
  away_score: number;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
}

export interface MatchFilters {
  gender?: "MEN" | "WOMEN" | "ALL";
  team?: string;
  date?: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
  status?: string;
}

export class MatchService {
  /**
   * 경기 목록을 가져옵니다. 필터(성별, 팀, 날짜)를 적용할 수 있습니다.
   */
  static async getMatches(filters: MatchFilters = {}): Promise<Match[]> {
    try {
      // 1. 상태 업데이트 (Lazy Update)
      await pool.query(`
        UPDATE matches 
        SET status = 'LIVE' 
        WHERE status = 'SCHEDULED' AND match_date <= NOW()
      `);

      await pool.query(`
        UPDATE matches 
        SET status = 'COMPLETED' 
        WHERE status IN ('SCHEDULED', 'LIVE') 
        AND match_date <= DATE_SUB(NOW(), INTERVAL 3 HOUR)
      `);

      // 2. 쿼리 빌딩
      let query = "SELECT * FROM matches";
      const conditions: string[] = [];
      const params: (string | string[])[] = [];

      // 성별 필터
      if (filters.gender === "MEN") {
        conditions.push(`(home_team IN (?) OR away_team IN (?))`);
        params.push(MEN_TEAMS, MEN_TEAMS);
      } else if (filters.gender === "WOMEN") {
        conditions.push(`(home_team IN (?) OR away_team IN (?))`);
        params.push(WOMEN_TEAMS, WOMEN_TEAMS);
      }

      // 팀 필터
      if (filters.team && filters.team !== "ALL") {
        conditions.push(`(home_team = ? OR away_team = ?)`);
        params.push(filters.team, filters.team);
      }

      // 날짜/월 필터
      if (filters.date) {
        conditions.push(`DATE(match_date) = ?`);
        params.push(filters.date);
      } else if (filters.month) {
        // e.g. '2025-12'
        conditions.push(`DATE_FORMAT(match_date, '%Y-%m') = ?`);
        params.push(filters.month);
      }

      // 상태 필터 (옵션)
      if (filters.status) {
        conditions.push(`status = ?`);
        params.push(filters.status);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY match_date ASC";

      const [rows] = await pool.query<Match[]>(query, params);
      return rows;
    } catch (error) {
      console.error("Error fetching matches:", error);
      throw error;
    }
  }

  /**
   * 경기 ID로 단일 경기 정보를 가져옵니다.
   */
  static async getMatchById(id: number): Promise<Match | null> {
    const [rows] = await pool.query<Match[]>("SELECT * FROM matches WHERE id = ?", [id]);
    return rows[0] || null;
  }

  /**
   * 특정 날짜의 경기만 가져옵니다. (Legacy support)
   */
  static async getMatchesByDate(dateStr: string): Promise<Match[]> {
    return this.getMatches({ date: dateStr });
  }
}
