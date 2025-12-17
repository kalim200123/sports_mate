import { getSessionUser } from "@/lib/auth";
import { TicketService } from "@/services/ticket.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/admin/auths/{id}/approve:
 *   post:
 *     summary: 직관 인증 승인/거절 (관리자용)
 *     tags:
 *       - Admin
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 인증 요청 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *     responses:
 *       200:
 *         description: 처리 성공
 */

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    // TODO: Admin Check
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const authId = Number(id);
    const body = await req.json();
    const { action } = body; // 'approve' | 'reject'

    if (action === "approve") {
      await TicketService.approveAuth(authId);
    } else {
      await TicketService.rejectAuth(authId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}
