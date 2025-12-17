import { UserService } from "@/services/user.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/users/{id}/public:
 *   get:
 *     summary: 사용자 공개 프로필 조회
 *     description: 특정 사용자의 공개 프로필 정보(닉네임, 아바타, 칭호, 응원 팀 등)를 조회합니다.
 *     tags:
 *       - Users (사용자)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 조회 성공
 *       404:
 *         description: 사용자를 찾을 수 없음
 *       500:
 *         description: 서버 내부 오류
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = Number(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const user = await UserService.getPublicProfile(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Public Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
