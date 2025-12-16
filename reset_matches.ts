import pool from "./src/lib/db";

async function resetMatches() {
  try {
    console.log("Dropping matches table...");
    await pool.query("DROP TABLE IF EXISTS matches");

    console.log("Creating matches table with new schema...");
    const createTableQuery = `
      CREATE TABLE matches (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        sport ENUM('VOLLEYBALL','BASKETBALL') NOT NULL DEFAULT 'VOLLEYBALL',
        match_date DATETIME NOT NULL COMMENT '경기 시작 시간',
        home_team VARCHAR(100) NOT NULL,
        away_team VARCHAR(100) NOT NULL,
        location VARCHAR(100) NOT NULL,
        home_score INT NOT NULL DEFAULT 0,
        away_score INT NOT NULL DEFAULT 0,
        status ENUM('SCHEDULED','LIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_matches_date (match_date),
        KEY idx_matches_sport (sport),
        KEY idx_matches_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createTableQuery);

    console.log("Matches table recreated successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting matches table:", error);
    process.exit(1);
  }
}

resetMatches();
