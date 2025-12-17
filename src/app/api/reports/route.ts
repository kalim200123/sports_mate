import { getSessionUser } from "@/lib/auth";
import { ReportService } from "@/services/report.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: 사용자 신고하기
 *     description: 특정 사용자를 신고합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedUserId:
 *                 type: integer
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: 신고 접수 성공
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { reportedUserId, reason, description } = body;

    if (!reportedUserId || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await ReportService.createReport({
      reporterId: user.id! as number, // user.id is string | number in some types, force cast if needed or ensure number
      reportedUserId: Number(reportedUserId),
      reason,
      description,
    });

    return NextResponse.json({ success: true, message: "Report submitted successfully" });
  } catch (error) {
    console.error("Report failed:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
