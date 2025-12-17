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
   * ID로 유저 조회
   */
  static async findById(id: number): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = ? AND deleted_at IS NULL`;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
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

    // Avatar assignment (F: 1-3, M: 4-6)
    const avatarOffset = gender === "FEMALE" ? 1 : 4;
    const avatarId = Math.floor(Math.random() * 3) + avatarOffset;

    // DB INSERT
    const insertQuery = `
      INSERT INTO users (kakao_id, nickname, gender, age_group, cheering_styles, mbti, avatar_id)
      VALUES (?, ?, ?, ?, ?, NULL, ?)
    `;

    await pool.query<ResultSetHeader>(insertQuery, [
      mockKakaoId,
      nickname,
      gender,
      ageGroup,
      cheeringStylesJson,
      avatarId,
    ]);

    // 3. 생성된 유저 다시 조회해서 반환
    const created = await this.findByKakaoId(mockKakaoId);
    if (!created) throw new Error("Failed to create mock user");

    return created;
  }

  /**
   * 유저 업데이트
   */
  static async updateUser(id: number, data: Partial<User>): Promise<void> {
    const { nickname, gender, age_group, cheering_styles, my_team, mbti } = data;

    // Build dynamic query
    const fields: string[] = [];
    const values: any[] = [];

    if (nickname) {
      fields.push("nickname = ?");
      values.push(nickname);
    }
    if (gender) {
      fields.push("gender = ?");
      values.push(gender);
    }
    if (age_group) {
      fields.push("age_group = ?");
      values.push(age_group);
    }
    if (cheering_styles) {
      fields.push("cheering_styles = ?");
      values.push(JSON.stringify(cheering_styles));
    }
    if (my_team) {
      fields.push("my_team = ?");
      values.push(my_team);
    }
    if (mbti) {
      fields.push("mbti = ?");
      values.push(mbti);
    }
    if (data.profile_image_url !== undefined) {
      fields.push("profile_image_url = ?");
      values.push(data.profile_image_url);
    }
    if (data.avatar_id !== undefined) {
      fields.push("avatar_id = ?");
      values.push(data.avatar_id);
    }

    if (data.win_rate !== undefined) {
      fields.push("win_rate = ?");
      values.push(data.win_rate);
    }

    if (data.total_visit !== undefined) {
      fields.push("total_visit = ?");
      values.push(data.total_visit);
    }
    if (data.title !== undefined) {
      fields.push("title = ?");
      values.push(data.title);
    }

    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    await pool.query(query, values);
  }

  /**
   * 공개 프로필 조회
   */
  static async getPublicProfile(id: number): Promise<Partial<User> | null> {
    const query = `
      SELECT id, nickname, gender, age_group, cheering_styles, my_team, mbti, avatar_id 
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    return (rows[0] as Partial<User>) || null;
  }
}
