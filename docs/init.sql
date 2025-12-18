-- init.sql
-- 스포츠 직관 동행 서비스 (MySQL 8.0+ / InnoDB)
-- 최종 업데이트: 2025-12-18
-- 핵심 정책: Room + User_Rooms(단일 상태 ENUM)로 대기열/승인/강퇴/재신청불가 지원

-- [Timezone 주의]
-- 클라우드 DB(RDS 등)에서는 권한 문제로 아래 라인이 에러날 수 있음.
-- 에러 발생 시 주석 처리하고, DB 파라미터 그룹(DB Parameter Group)에서 timezone을 설정하세요.
-- SET time_zone = '+09:00';

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1) Users (사용자)
-- ==========================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  `kakao_id` VARCHAR(255) NOT NULL UNIQUE,
  `nickname` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255),

  -- 필수 프로필
  `gender` ENUM('MALE','FEMALE') NOT NULL,
  `age_group` VARCHAR(20) NULL COMMENT '20s_early, 30s etc',
  `mbti` CHAR(4) NULL,

  -- 응원 스타일 태그(JSON)
  -- 예: ["#조용히집중", "#열정응원"]
  `cheering_styles` JSON NOT NULL,

  -- 찐팬/칭호 (Gamification)
  `win_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0.00 ~ 100.00',
  `win_count` INT NOT NULL DEFAULT 0,
  `loss_count` INT NOT NULL DEFAULT 0,
  `total_visits` INT NOT NULL DEFAULT 0 COMMENT '직관 횟수',
  `title` VARCHAR(50) NULL COMMENT '현재 칭호(예: 승리요정)',

  -- 추가 프로필
  `profile_image_url` VARCHAR(2048) NULL,
  `avatar_id` INT NULL DEFAULT 1,
  `my_team` VARCHAR(50) NULL COMMENT '응원하는 팀',
  `region` VARCHAR(50) NULL COMMENT '활동 지역',

  -- Soft Delete
  `deleted_at` DATETIME NULL,

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `kakao_id` (`kakao_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2) Matches (경기 일정)
-- ==========================================
DROP TABLE IF EXISTS `matches`;
CREATE TABLE `matches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  `sport` ENUM('VOLLEYBALL','BASKETBALL') NOT NULL DEFAULT 'VOLLEYBALL',
  `match_date` DATETIME NOT NULL COMMENT '경기 시작 시간',

  `home_team` VARCHAR(100) NOT NULL,
  `away_team` VARCHAR(100) NOT NULL,

  `location` VARCHAR(100) NOT NULL,

  -- 점수
  `home_score` INT NOT NULL DEFAULT 0,
  `away_score` INT NOT NULL DEFAULT 0,

  -- 경기 상태
  `status` ENUM('SCHEDULED','LIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_matches_date` (`match_date`),
  INDEX `idx_matches_sport` (`sport`),
  INDEX `idx_matches_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 3) Rooms (직관 동행 방)
-- ==========================================
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,

  `match_id` INT NOT NULL,
  `host_id` INT NOT NULL,

  `title` VARCHAR(100) NOT NULL,
  `content` TEXT NULL,

  -- 티켓 예매 상태
  `ticket_status` ENUM('RESERVED','NOT_RESERVED') NULL DEFAULT 'NOT_RESERVED',

  `max_count` INT NOT NULL DEFAULT 4,

  -- 방 상태 (검색 노출 제어용)
  `status` ENUM('OPEN','FULL','CLOSED','DELETED') NULL DEFAULT 'OPEN',

  -- 지역 및 공지사항
  `region` VARCHAR(50) NULL COMMENT '방 지역',
  `notice` TEXT NULL COMMENT '방 공지사항',

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft Delete'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 4) User_Rooms (참여 멤버 및 대기열) - 핵심
-- ==========================================
DROP TABLE IF EXISTS `user_rooms`;
CREATE TABLE `user_rooms` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,

  `user_id` INT NOT NULL,
  `room_id` INT NOT NULL,

  -- 참여 상태 (Timeline 순서)
  -- PENDING: 신청함 (대기열)
  -- CANCELLED: 신청 취소함
  -- REJECTED: 방장이 거절함 (해당 방 재신청 불가)
  -- JOINED: 승인됨 & 참여중 (채팅 가능)
  -- LEFT: 스스로 나감 (재신청 가능 정책)
  -- KICKED: 방장이 강퇴함 (해당 방 재신청 불가)
  `status` ENUM('PENDING','CANCELLED','REJECTED','JOINED','LEFT','KICKED') NULL DEFAULT 'PENDING',

  `role` ENUM('HOST','GUEST') NULL DEFAULT 'GUEST',

  `message` VARCHAR(255) NULL COMMENT '신청 시 한 줄 메시지',

  -- 시간 컬럼(운영/디버깅용)
  `requested_at` TIMESTAMP NULL DEFAULT NULL COMMENT '신청 일시',
  `decided_at` TIMESTAMP NULL COMMENT '승인/거절/강퇴 일시',
  `joined_at` TIMESTAMP NULL COMMENT 'JOINED 전환 일시(=승인 일시)',
  `left_at` TIMESTAMP NULL COMMENT 'LEFT/KICKED 전환 일시',

  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_read_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT '마지막 읽은 시각',

  CONSTRAINT `user_rooms_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,

  -- [핵심 제약조건] 한 유저는 한 방에 오직 하나의 상태만 가짐
  UNIQUE INDEX `unique_user_room` (`user_id`, `room_id`),

  INDEX `room_id` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 5) Room Messages (채팅)
-- ==========================================
DROP TABLE IF EXISTS `room_messages`;
CREATE TABLE `room_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,

  `room_id` INT NOT NULL,
  `user_id` INT NOT NULL,

  `type` ENUM('TEXT','SYSTEM') NOT NULL DEFAULT 'TEXT',
  `content` TEXT NOT NULL COMMENT 'TEXT는 64KB 제한. 더 길면 LONGTEXT 고려',
  `message_type` VARCHAR(20) NULL DEFAULT 'TEXT',

  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT `room_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,

  INDEX `room_id` (`room_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 6) Ticket Auths (직관 인증)
-- ==========================================
DROP TABLE IF EXISTS `ticket_auths`;
CREATE TABLE `ticket_auths` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  `user_id` BIGINT UNSIGNED NOT NULL,
  `match_id` BIGINT UNSIGNED NOT NULL,

  `image_url` VARCHAR(512) NOT NULL,
  `content` TEXT NULL COMMENT '인증 메모',
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',

  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT `fk_ticket_auths_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ticket_auths_match` FOREIGN KEY (`match_id`) REFERENCES `matches` (`id`) ON DELETE CASCADE,

  UNIQUE INDEX `uk_ticket_user_match` (`user_id`, `match_id`),
  INDEX `fk_ticket_auths_match` (`match_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
