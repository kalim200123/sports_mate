import "dotenv/config";
import pool from "./src/lib/db";

async function checkSchema() {
  try {
    const [rows] = await pool.query("DESCRIBE rooms");
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
