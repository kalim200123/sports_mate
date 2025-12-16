import { authOptions } from "@/lib/auth";
import { UserService } from "@/services/user.service";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nickname
 *               - gender
 *             properties:
 *               nickname:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE]
 *               age_group:
 *                 type: string
 *               cheering_styles:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation Error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server Error
 */

// GET Handler
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await UserService.findById(Number(session.user.id));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile Get Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/users/profile:
 *   put:
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
*/
