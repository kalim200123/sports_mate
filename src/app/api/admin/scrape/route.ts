import { ScraperService } from "@/services/scraper.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/admin/scrape:
 *   post:
 *     summary: Scrape V-League matches
 *     description: Triggers a scraping job for the current season's schedule from the KOVO website.
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Year to scrape (e.g. 2025)
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         description: Month to scrape (e.g. 12)
 *     responses:
 *       200:
 *         description: Scrape successful
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
 *       500:
 *         description: Server error
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
