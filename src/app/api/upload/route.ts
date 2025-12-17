import fs from "fs";
import { NextResponse } from "next/server";
import path from "path";

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: 이미지 파일 업로드
 *     description: 이미지 파일을 서버에 업로드하고 URL을 반환합니다. (최대 5MB, 이미지 파일만 허용)
 *     tags:
 *       - Upload (업로드)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: 업로드할 이미지 파일
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: 업로드된 파일의 접근 URL
 *       400:
 *         description: 파일 없음 또는 잘못된 형식
 *       500:
 *         description: 서버 내부 오류
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "File is not an image" }, { status: 400 });
    }

    // Prepare Upload Directory
    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate Unique Filename
    const timestamp = Date.now();
    // Sanitize filename
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
    const filename = `${timestamp}_${safeName}`;
    const filePath = path.join(uploadDir, filename);

    // Convert Web File to Node Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to Disk
    await fs.promises.writeFile(filePath, buffer);

    // Return Public URL
    const fileUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
