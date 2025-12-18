import pool from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const roomId = params.id;
    const { notice } = await request.json();

    await pool.query("UPDATE rooms SET notice = ? WHERE id = ?", [notice, roomId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to update notice" }, { status: 500 });
  }
}
