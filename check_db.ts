import 'dotenv/config';
import pool from './src/lib/db';

async function check() {
  const [rows] = await pool.query("SELECT sport, DATE_FORMAT(match_date, '%Y-%m') as month, count(*) as count FROM matches GROUP BY sport, month ORDER BY sport, month");
  console.table(rows);
  process.exit(0);
}
check().catch(console.error);
