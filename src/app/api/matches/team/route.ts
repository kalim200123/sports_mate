import { MatchService } from "@/services/match.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/matches/team:
 *   get:
 *     summary: 팀별 경기 일정 조회
 *     description: 특정 팀의 전체 경기 일정을 조회합니다.
 *     tags:
 *       - Matches (경기)
 *     parameters:
 *       - in: query
 *         name: teamName
 *         required: true
 *         schema:
 *           type: string
 *         description: "팀 이름 (예: 대한항공, 흥국생명)"
 *     responses:
 *       200:
 *         description: 조회 성공
 *       400:
 *         description: 팀 이름 누락
 *       500:
 *         description: 서버 내부 오류
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamName = searchParams.get("teamName");

  if (!teamName) {
    return NextResponse.json({ success: false, error: "Team name required" }, { status: 400 });
  }

  try {
    const matches = await MatchService.getMatchesByTeam(teamName);
    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    console.error("Failed to fetch team matches:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch matches" }, { status: 500 });
  }
}
