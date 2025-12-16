import "dotenv/config"; // Load environment variables!
import pool from "./src/lib/db";

async function resetFullDatabase() {
  try {
    console.log("Starting full database reset...");

    // 1. Disable FK checks to allow dropping tables freely
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");

    // 2. Drop all tables
    const tables = ["ticket_auths", "room_messages", "user_rooms", "rooms", "matches", "users"];
    for (const table of tables) {
      console.log(`Dropping table ${table}...`);
      await pool.query(`DROP TABLE IF EXISTS ${table}`);
    }

    // 3. Recreate tables (Schema from docs/init.sql)
    console.log("Recreating tables...");

    // Users
    await pool.query(`
      CREATE TABLE users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        kakao_id VARCHAR(255) NOT NULL UNIQUE,
        nickname VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        gender ENUM('MALE','FEMALE') NOT NULL,
        age_group VARCHAR(20) NULL COMMENT '20s_early, 30s etc',
        mbti CHAR(4) NULL,
        cheering_styles JSON NOT NULL,
        win_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        total_visits INT NOT NULL DEFAULT 0,
        title VARCHAR(50) NULL,
        deleted_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Matches
    await pool.query(`
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
    `);

    // Rooms
    await pool.query(`
      CREATE TABLE rooms (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        match_id BIGINT UNSIGNED NOT NULL,
        host_id  BIGINT UNSIGNED NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NULL,
        seat_area  VARCHAR(50) NULL,
        seat_block VARCHAR(50) NULL,
        seat_row   VARCHAR(50) NULL,
        max_count INT NOT NULL DEFAULT 4,
        is_approval_required TINYINT(1) NOT NULL DEFAULT 1,
        status ENUM('OPEN','FULL','CLOSED','DELETED') NOT NULL DEFAULT 'OPEN',
        closed_at DATETIME NULL,
        deleted_at DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_rooms_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        CONSTRAINT fk_rooms_host  FOREIGN KEY (host_id)  REFERENCES users(id),
        KEY idx_rooms_match_status (match_id, status),
        KEY idx_rooms_host (host_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // User Rooms
    await pool.query(`
      CREATE TABLE user_rooms (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        room_id BIGINT UNSIGNED NOT NULL,
        status ENUM('PENDING','CANCELLED','REJECTED','JOINED','LEFT','KICKED') NOT NULL DEFAULT 'PENDING',
        role ENUM('HOST','GUEST') NOT NULL DEFAULT 'GUEST',
        message VARCHAR(255) NULL,
        requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        decided_at   DATETIME NULL,
        joined_at    DATETIME NULL,
        left_at      DATETIME NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_rooms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_rooms_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_room (user_id, room_id),
        KEY idx_user_rooms_room_status (room_id, status),
        KEY idx_user_rooms_user_status (user_id, status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Room Messages
    await pool.query(`
      CREATE TABLE room_messages (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        room_id BIGINT UNSIGNED NOT NULL,
        user_id BIGINT UNSIGNED NOT NULL,
        type ENUM('TEXT','SYSTEM') NOT NULL DEFAULT 'TEXT',
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_room_messages_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        CONSTRAINT fk_room_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        KEY idx_room_messages_room_created (room_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ticket Auths
    await pool.query(`
      CREATE TABLE ticket_auths (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id  BIGINT UNSIGNED NOT NULL,
        match_id BIGINT UNSIGNED NOT NULL,
        image_url VARCHAR(512) NOT NULL,
        status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_ticket_auths_user  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_ticket_auths_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
        UNIQUE KEY uk_ticket_user_match (user_id, match_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Re-enable FK checks
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("FULL Database reset completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

resetFullDatabase();
