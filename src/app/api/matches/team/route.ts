import { MatchService } from "@/services/match.service";
import { NextRequest, NextResponse } from "next/server";

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
