import "dotenv/config";
import pool from "./src/lib/db";

async function resetRooms() {
  try {
    console.log("Dropping rooms, user_rooms, room_messages tables...");

    // Drop dependent tables first
    await pool.query("DROP TABLE IF EXISTS room_messages");
    await pool.query("DROP TABLE IF EXISTS user_rooms");
    await pool.query("DROP TABLE IF EXISTS rooms");

    console.log("Creating rooms table with new schema...");

    const createRoomsQuery = `
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id INT NOT NULL,
        host_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT,
        location VARCHAR(100),
        ticket_status ENUM('RESERVED', 'NOT_RESERVED') DEFAULT 'NOT_RESERVED',
        max_count INT NOT NULL DEFAULT 4,
        is_approval_required TINYINT(1) DEFAULT 1,
        status ENUM('OPEN', 'FULL', 'CLOSED', 'DELETED') DEFAULT 'OPEN',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL
        -- Removed Foreign Keys for dev simplicity if needed, or keeping them if matched
        -- FOREIGN KEY (match_id) REFERENCES matches(id),
        -- FOREIGN KEY (host_id) REFERENCES users(id)
      )
    `;
    await pool.query(createRoomsQuery);

    console.log("Creating user_rooms table...");
    const createUserRoomsQuery = `
      CREATE TABLE IF NOT EXISTS user_rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        room_id INT NOT NULL,
        status ENUM('PENDING', 'CANCELLED', 'REJECTED', 'JOINED', 'LEFT', 'KICKED') DEFAULT 'PENDING',
        role ENUM('HOST', 'GUEST') DEFAULT 'GUEST',
        message VARCHAR(255),
        requested_at TIMESTAMP NULL,
        decided_at TIMESTAMP NULL,
        joined_at TIMESTAMP NULL,
        left_at TIMESTAMP NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_room (user_id, room_id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `;
    await pool.query(createUserRoomsQuery);

    console.log("Creating room_messages table...");
    const createRoomMessagesQuery = `
      CREATE TABLE IF NOT EXISTS room_messages (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          room_id INT NOT NULL,
          user_id INT NOT NULL,
          content TEXT NOT NULL,
          message_type VARCHAR(20) DEFAULT 'TEXT',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )
    `;
    await pool.query(createRoomMessagesQuery);

    console.log("Rooms tables reset successfully with new schema.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting rooms table:", error);
    process.exit(1);
  }
}

resetRooms();
