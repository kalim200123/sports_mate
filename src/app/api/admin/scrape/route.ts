import { ScraperService } from "@/services/scraper.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/admin/scrape:
 *   post:
 *     summary: 경기 데이터 스크래핑 및 업데이트
 *     description: KOVO 공식 홈페이지에서 경기 일정을 크롤링합니다. 새 경기를 추가하고, 기존 경기의 **스코어 및 상태**를 최신으로 업데이트합니다.
 *     tags:
 *       - Admin (관리자)
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: "스크래핑할 연도 (예: 2025) - 현재는 전체 시즌 자동 처리"
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: "스크래핑할 월 (예: 12) - 현재는 전체 시즌 자동 처리"
 *     responses:
 *       200:
 *         description: 스크래핑 및 업데이트 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 count:
 *                   type: number
 *                   description: 새로 추가된 경기 수
 *       500:
 *         description: 서버 내부 오류
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") || "2025";
    const month = searchParams.get("month") || "12";
    // 간단한 보안 키 검사 (실제 운영 시에는 더 강력한 인증 필요)
    // const authHeader = request.headers.get('Authorization');
    // if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) { ... }

    console.log(`[API] Triggering scraper for ${year}-${month}`);

    // 2025-10 부터 2026-03 까지 한 번에 긁고 싶다면 반복문 처리 가능하지만
    // 일단 요청된 월만 처리하도록 함.
    const count = await ScraperService.scrapeAndSaveMatches();

    return NextResponse.json({
      success: true,
      message: `Scraped ${count} matches for ${year}-${month}`,
      count,
    });
  } catch (error: unknown) {
    console.error("[API] Scrape failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
