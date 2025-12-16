import pool from "@/lib/db";
import { User } from "@/types/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export class UserService {
  /**
   * 카카오 ID로 유저 조회 (실제 운영용)
   */
  static async findByKakaoId(kakaoId: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE kakao_id = ? AND deleted_at IS NULL`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [kakaoId]);
    return (rows[0] as User) || null;
  }

  /**
   * Mock 닉네임으로 유저 조회 또는 생성 (개발 및 테스트용)
   * - 존재하면 반환
   * - 없으면 자동 생성 후 반환 (성별, 연령대 필수)
   */
  static async findOrCreateMockUser(nickname: string, gender: "MALE" | "FEMALE", ageGroup: string): Promise<User> {
    const mockKakaoId = `mock_${nickname}`; // 가짜 카카오 ID 생성

    // 1. 조회
    const existingUser = await this.findByKakaoId(mockKakaoId);
    if (existingUser) {
      return existingUser;
    }

    // 2. 없으면 생성
    // JSON.stringify needs to be handled if mysql2 doesn't auto-convert array to json string for JSON columns.
    const cheeringStylesJson = JSON.stringify([]);

    // DB INSERT
    const insertQuery = `
      INSERT INTO users (kakao_id, nickname, gender, age_group, cheering_styles, mbti)
      VALUES (?, ?, ?, ?, ?, NULL)
    `;

    await pool.query<ResultSetHeader>(insertQuery, [mockKakaoId, nickname, gender, ageGroup, cheeringStylesJson]);

    // 3. 생성된 유저 다시 조회해서 반환
    const created = await this.findByKakaoId(mockKakaoId);
    if (!created) throw new Error("Failed to create mock user");

    return created;
  }

  /**
   * 유저 정보 수정
   */
  static async updateUser(userId: number, data: Partial<User>): Promise<void> {
    // 1. 업데이트할 필드 준비
    const updates: Record<string, string | number | null | undefined> = {};
    if (data.nickname) updates.nickname = data.nickname;
    if (data.gender) updates.gender = data.gender;
    if (data.age_group) updates.age_group = data.age_group;
    if (data.mbti !== undefined) updates.mbti = data.mbti;

    // JSON 필드 처리
    if (data.cheering_styles) {
      updates.cheering_styles = JSON.stringify(data.cheering_styles);
    }

    if (Object.keys(updates).length === 0) return;

    const query = `UPDATE users SET ? WHERE id = ?`;
    await pool.query(query, [updates, userId]);
  }
}
