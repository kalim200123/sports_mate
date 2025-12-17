import "dotenv/config";
import { RowDataPacket } from "mysql2";
import pool from "../src/lib/db";

async function migrateAvatars() {
  console.log("Starting avatar migration...");
  try {
    const connection = await pool.getConnection();

    // 1. Get users with null profile_image_url and valid avatar_id
    const [users] = await connection.query<RowDataPacket[]>(
      "SELECT id, avatar_id FROM users WHERE profile_image_url IS NULL"
    );

    console.log(`Found ${users.length} users to migrate.`);

    for (const user of users) {
      const avatarUrl = `/avatars/${user.avatar_id || 1}.png`; // Default to 1 if 0/null
      await connection.query("UPDATE users SET profile_image_url = ? WHERE id = ?", [avatarUrl, user.id]);
    }

    console.log("Migration completed successfully.");
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateAvatars();
