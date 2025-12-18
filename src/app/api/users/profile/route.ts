import { authOptions } from "@/lib/auth";
import { UserService } from "@/services/user.service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: 내 프로필 수정
 *     description: 로그인된 사용자의 프로필 정보(닉네임, 성별, 응원 팀, 스타일 등)를 수정합니다.
 *     tags:
 *       - Users (사용자)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *               - gender
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: 닉네임
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *                 description: 성별
 *               age_group:
 *                 type: string
 *                 description: "연령대 (예: 20s, 30s)"
 *               my_team:
 *                 type: string
 *                 description: "응원하는 팀 이름 (예: 서울 우리카드)"
 *               cheering_styles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 응원 스타일 목록 (최대 3개)
 *               profile_image_url:
 *                 type: string
 *                 description: 업로드된 프로필 이미지 URL
 *               title:
 *                 type: string
 *                 description: 사용자 칭호
 *               win_rate:
 *                 type: number
 *                 description: 직관 승률
 *               total_visits:
 *                 type: number
 *                 description: 직관 횟수
 *     responses:
 *       200:
 *         description: 프로필 수정 성공
 *       400:
 *         description: 필수 입력값 누락 또는 유효성 검사 실패
 *       401:
 *         description: 인증되지 않은 사용자 (로그인 필요)
 *       500:
 *         description: 서버 내부 오류
 */

// GET Handler
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.findById(Number(session.user.id));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile Get Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users/profile:
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation Error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */
export async function PUT(request: Request) {
  try {
    // 1. Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await request.json();

    // 2. Validation (Controller Layer Responsibility)
    const {
      nickname,
      gender,
      age_group,
      cheering_styles,
      my_team,
      profile_image_url,
      title,
      win_rate,
      total_visits,
      region,
    } = body;

    // Optional: Add validation for new fields if needed

    if (!nickname || !gender) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    // 3. Title Validation
    if (title) {
      const user = await UserService.findById(userId);
      if (user) {
        const unlockedTitles = user.unlocked_titles || []; // findById now populates this
        const isValidTitle = unlockedTitles.some((t) => t.name === title);
        if (!isValidTitle) {
          return NextResponse.json({ error: "Title not unlocked" }, { status: 400 });
        }
      }
    }

    // 4. Call Service Layer
    await UserService.updateUser(userId, {
      nickname,
      gender,
      age_group,
      cheering_styles,
      my_team,
      profile_image_url,
      title,
      win_rate,
      total_visits,
      region,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
