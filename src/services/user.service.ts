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
    const user = (rows[0] as User) || null;
    if (user) {
      user.unlocked_titles = this.getUnlockedTitles(user);
    }
    return user;
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
    const randomNum = Math.floor(Math.random() * 3) + avatarOffset;
    const defaultProfileUrl = `/avatars/${randomNum}.png`;

    // DB INSERT
    const insertQuery = `
      INSERT INTO users (kakao_id, nickname, gender, age_group, cheering_styles, mbti, profile_image_url)
      VALUES (?, ?, ?, ?, ?, NULL, ?)
    `;

    await pool.query<ResultSetHeader>(insertQuery, [
      mockKakaoId,
      nickname,
      gender,
      ageGroup,
      cheeringStylesJson,
      defaultProfileUrl,
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
    const values: (string | number | null)[] = [];

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

    if (data.win_rate !== undefined) {
      fields.push("win_rate = ?");
      values.push(data.win_rate);
    }

    if (data.total_visits !== undefined) {
      fields.push("total_visits = ?");
      values.push(data.total_visits);
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
  /**
   * 칭호 목록 계산
   */
  static getUnlockedTitles(user: Partial<User>): { id: string; name: string }[] {
    const titles = [
      { id: "newbie", name: "신입 메이트" }, // Default
    ];

    if ((user.total_visits || 0) >= 1) {
      titles.push({ id: "debut", name: "직관 데뷔" });
    }

    if ((user.total_visits || 0) >= 5) {
      titles.push({ id: "pro_visit", name: "프로 직관러" });
    }

    if ((user.total_visits || 0) >= 5 && (user.win_rate || 0) >= 60) {
      titles.push({ id: "victory_fairy", name: "승리 요정" });
    }

    if ((user.loss_count || 0) >= 5) {
      titles.push({ id: "unbreakable", name: "꺾이지 않는 마음" });
    }

    // True Fan: My Team + 10 visits
    if (user.my_team && (user.total_visits || 0) >= 10) {
      titles.push({ id: "true_fan", name: `${user.my_team} 찐팬` });
    }

    return titles;
  }

  /**
   * 공개 프로필 조회
   */
  static async getPublicProfile(id: number): Promise<Partial<User> | null> {
    const query = `
      SELECT id, nickname, gender, age_group, cheering_styles, my_team, mbti, profile_image_url, title, win_rate, total_visits, win_count, loss_count
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    const user = (rows[0] as Partial<User>) || null;

    if (user) {
      user.unlocked_titles = this.getUnlockedTitles(user);
    }

    return user;
  }
}
