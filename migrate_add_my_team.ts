import pool from "./src/lib/db";

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log("Checking if 'my_team' column exists...");

    const [rows] = await connection.query("SHOW COLUMNS FROM users LIKE 'my_team'");
    if ((rows as any[]).length === 0) {
      console.log("Adding 'my_team' column...");
      await connection.query("ALTER TABLE users ADD COLUMN my_team VARCHAR(50)");
      console.log("Migration successful: 'my_team' column added.");
    } else {
      console.log("'my_team' column already exists. Skipping.");
    }

    connection.release();
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit();
  }
}

migrate();
