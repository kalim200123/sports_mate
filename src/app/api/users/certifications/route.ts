import { TicketService } from "@/services/ticket.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
  }

  try {
    const certifications = await TicketService.getCertifications(Number(userId));
    return NextResponse.json({ success: true, data: certifications });
  } catch (error) {
    console.error("Failed to fetch certifications:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
