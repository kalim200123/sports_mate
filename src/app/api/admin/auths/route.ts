import { getSessionUser } from "@/lib/auth";
import { TicketService } from "@/services/ticket.service";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/admin/auths:
 *   get:
 *     summary: 대기 중인 직관 인증 목록 조회 (관리자용)
 *     tags:
 *       - Admin
 *     responses:
 *       200:
 *         description: 조회 성공
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    // TODO: Admin Check
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const list = await TicketService.getPendingAuths();
    return NextResponse.json({ success: true, data: list });
  } catch {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
