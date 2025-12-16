import { authOptions } from "@/lib/auth";
import { UserService } from "@/services/user.service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    // 1. Auth Check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await request.json();

    // 2. Validation (Controller Layer Responsibility)
    const { nickname, gender, age_group, cheering_styles } = body;

    if (!nickname || !gender) {
      return NextResponse.json({ error: "Nickname and Gender are required" }, { status: 400 });
    }

    // 3. Call Service Layer
    await UserService.updateUser(userId, {
      nickname,
      gender,
      age_group,
      cheering_styles,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
