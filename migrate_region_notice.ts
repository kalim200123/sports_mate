import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log("Starting migration...");

    // 1. Add region to users
    try {
      await connection.query("ALTER TABLE users ADD COLUMN region VARCHAR(50) DEFAULT NULL");
      console.log("Added region to users");
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "ER_DUP_FIELDNAME") console.log("region column already exists in users");
      else console.error("Error adding region to users:", e);
    }

    // 2. Add region to rooms
    try {
      await connection.query("ALTER TABLE rooms ADD COLUMN region VARCHAR(50) DEFAULT NULL");
      console.log("Added region to rooms");
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "ER_DUP_FIELDNAME") console.log("region column already exists in rooms");
      else console.error("Error adding region to rooms:", e);
    }

    // 3. Add notice to rooms
    try {
      await connection.query("ALTER TABLE rooms ADD COLUMN notice TEXT DEFAULT NULL");
      console.log("Added notice to rooms");
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === "ER_DUP_FIELDNAME") console.log("notice column already exists in rooms");
      else console.error("Error adding notice to rooms:", e);
    }

    console.log("Migration complete.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    connection.release();
    process.exit();
  }
}

migrate();
