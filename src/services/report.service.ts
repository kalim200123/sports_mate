import pool from "@/lib/db";
import { ResultSetHeader } from "mysql2";

export class ReportService {
  /**
   * 사용자 신고 생성
   */
  static async createReport(data: {
    reporterId: number;
    reportedUserId: number;
    reason: string;
    description?: string;
  }): Promise<number> {
    const query = `
      INSERT INTO reports (reporter_id, reported_user_id, reason, description)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query<ResultSetHeader>(query, [
      data.reporterId,
      data.reportedUserId,
      data.reason,
      data.description || null,
    ]);
    return result.insertId;
  }
}
