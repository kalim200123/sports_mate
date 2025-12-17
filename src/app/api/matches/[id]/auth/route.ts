import { getSessionUser } from "@/lib/auth";
import { TicketService } from "@/services/ticket.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/matches/{id}/auth:
 *   post:
 *     summary: 직관 인증 요청 (티켓 사진 업로드 후 호출)
 *     responses:
 *       200:
 *         description: 성공
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const matchId = Number(id);
    const body = await req.json();
    const { imageUrl } = body;

    if (!imageUrl) return NextResponse.json({ success: false, error: "Image required" }, { status: 400 });

    await TicketService.createAuth({
      userId: user.id as number,
      matchId,
      imageUrl,
    });

    return NextResponse.json({ success: true, message: "Auth requested" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/matches/{id}/auth:
 *   get:
 *     summary: 내 인증 상태 조회
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const matchId = Number(id);

    const auth = await TicketService.getAuthStatus(user.id as number, matchId);
    return NextResponse.json({ success: true, data: auth });
  } catch {
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}
