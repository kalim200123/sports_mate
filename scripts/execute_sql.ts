import "dotenv/config";
import fs from "fs";
import path from "path";
import pool from "../src/lib/db";

async function run() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("Please provide a SQL file path");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), sqlFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(filePath, "utf-8");
  console.log(`Executing SQL from ${sqlFile}...`);

  try {
    const connection = await pool.getConnection();
    await connection.query(sql);
    connection.release();
    console.log("Success!");
    process.exit(0);
  } catch (error) {
    console.error("Error executing SQL:", error);
    process.exit(1);
  }
}

run();
