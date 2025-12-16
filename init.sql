-- Database Initialization SQL for Sports Mate MVP

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kakao_id VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    gender ENUM('MALE', 'FEMALE') NOT NULL,
    age_group VARCHAR(20),
    mbti VARCHAR(10),
    cheering_styles JSON NOT NULL, -- Defaults to '[]' via Application or Trigger, schema says DEFAULT (JSON_ARRAY())
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- 2. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_date DATETIME NOT NULL,
    home_team VARCHAR(50) NOT NULL,
    away_team VARCHAR(50) NOT NULL,
    stadium VARCHAR(100),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Rooms Table
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
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (host_id) REFERENCES users(id)
);

-- 4. User Rooms (Participation) Table
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
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- 5. Room Messages Table
CREATE TABLE IF NOT EXISTS room_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
