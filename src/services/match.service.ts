import {
  BASKETBALL_MEN_TEAMS,
  BASKETBALL_TEAMS,
  BASKETBALL_WOMEN_TEAMS,
  MEN_TEAMS,
  VOLLEYBALL_TEAMS,
  WOMEN_TEAMS,
} from "@/lib/constants";
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
  sport?: "VOLLEYBALL" | "BASKETBALL";
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

      // 종목 필터
      if (filters.sport) {
        conditions.push(`sport = ?`);
        params.push(filters.sport);
      }

      // 성별 필터
      if (filters.gender === "MEN") {
        if (filters.sport === "BASKETBALL") {
          conditions.push(`(home_team IN (?) OR away_team IN (?))`);
          params.push(BASKETBALL_MEN_TEAMS, BASKETBALL_MEN_TEAMS);
        } else {
          // Default to Volleyball or if VOLLEYBALL selected
          conditions.push(`(home_team IN (?) OR away_team IN (?))`);
          params.push(MEN_TEAMS, MEN_TEAMS);
        }
      } else if (filters.gender === "WOMEN") {
        if (filters.sport === "BASKETBALL") {
          conditions.push(`(home_team IN (?) OR away_team IN (?))`);
          params.push(BASKETBALL_WOMEN_TEAMS, BASKETBALL_WOMEN_TEAMS);
        } else {
          conditions.push(`(home_team IN (?) OR away_team IN (?))`);
          params.push(WOMEN_TEAMS, WOMEN_TEAMS);
        }
      }

      // 팀 필터
      if (filters.team && filters.team !== "ALL") {
        // Strip sport suffix for DB matching
        const teamName = filters.team.replace("(배구)", "").replace("(농구)", "");
        conditions.push(`(home_team = ? OR away_team = ?)`);
        params.push(teamName, teamName);
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
  /**
   * 오늘 진행되는 경기 목록을 가져옵니다. (메인 페이지용)
   */
  static async getTodaysMatches(): Promise<Match[]> {
    const query = `
      SELECT * FROM matches 
      WHERE match_date >= CURDATE() AND match_date < CURDATE() + INTERVAL 1 DAY
      ORDER BY match_date ASC
    `;
    const [rows] = await pool.query<Match[]>(query);
    return rows;
  }

  /**
   * 오늘 이후 예정된(혹은 진행중인) 경기를 가져옵니다. (메인 페이지용)
   */
  static async getUpcomingMatches(limit: number = 10): Promise<Match[]> {
    const query = `
      SELECT * FROM matches 
      WHERE match_date >= CURDATE()
      ORDER BY match_date ASC
      LIMIT ?
    `;
    const [rows] = await pool.query<Match[]>(query, [limit]);
    return rows;
  }

  /**
   * 특정 팀의 경기 일정을 가져옵니다.
   */
  static async getMatchesByTeam(teamName: string, includePast: boolean = false): Promise<Match[]> {
    // 1. Resolve Explicit Sport from Suffix
    let pureName = teamName;
    let explicitSport = null;

    if (teamName.includes("(배구)")) {
      pureName = teamName.replace("(배구)", "");
      explicitSport = "VOLLEYBALL";
    } else if (teamName.includes("(농구)")) {
      pureName = teamName.replace("(농구)", "");
      explicitSport = "BASKETBALL";
    }

    // 2. Default Logic if no explicit sport (Legacy support or Pure Name)
    if (!explicitSport) {
      if (pureName === "정관장") {
        explicitSport = "VOLLEYBALL"; // Hard Default for Legacy
      } else {
        // General Check
        const isVolleyball = VOLLEYBALL_TEAMS.some((t) => t.replace("(배구)", "") === pureName);
        const isBasketball = BASKETBALL_TEAMS.some((t) => t.replace("(농구)", "") === pureName);

        if (isVolleyball && isBasketball) explicitSport = "VOLLEYBALL";
        else if (isVolleyball) explicitSport = "VOLLEYBALL";
        else if (isBasketball) explicitSport = "BASKETBALL";
      }
    }

    let query = `
      SELECT * FROM matches 
      WHERE (home_team = ? OR away_team = ?) 
    `;

    const params: (string | number)[] = [pureName, pureName];

    if (explicitSport) {
      query += ` AND sport = ? `;
      params.push(explicitSport);
    }

    if (!includePast) {
      query += ` AND match_date >= CURDATE() `;
    }

    query += ` ORDER BY match_date ASC `;

    const [rows] = await pool.query<Match[]>(query, params);
    return rows;
  }
}
