-- init.sql
-- 스포츠 직관 동행 서비스 MVP (MySQL 8.0+ / InnoDB)
-- 작성일: 2025-12-15
-- 핵심 정책: Room + User_Rooms(단일 상태 ENUM)로 대기열/승인/강퇴/재신청불가 지원

-- [Timezone 주의]
-- 클라우드 DB(RDS 등)에서는 권한 문제로 아래 라인이 에러날 수 있음.
-- 에러 발생 시 주석 처리하고, DB 파라미터 그룹(DB Parameter Group)에서 timezone을 설정하세요.
-- SET time_zone = '+09:00';

SET NAMES utf8mb4;

-- ==========================================
-- 1) Users (사용자)
-- ==========================================
CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  kakao_id VARCHAR(255) NOT NULL UNIQUE,
  nickname VARCHAR(50) NOT NULL,
  email VARCHAR(255),

  -- 필수 프로필
  gender ENUM('MALE','FEMALE') NOT NULL,
  age_group VARCHAR(20) NULL COMMENT '20s_early, 30s etc',
  mbti CHAR(4) NULL,

  -- 응원 스타일 태그(JSON)
  -- 예: ["#조용히집중", "#열정응원"]
  -- [JSON DEFAULT 주의]
  -- MySQL 8.0.13+ 에서 표현식 DEFAULT가 가능. (하위 버전/환경이면 NULL로 두고 앱에서 [] 처리 권장)
  cheering_styles JSON NOT NULL DEFAULT (JSON_ARRAY()),

  -- 찐팬/칭호 (Gamification)
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT '0.00 ~ 100.00',
  total_visits INT NOT NULL DEFAULT 0 COMMENT '직관 횟수',
  title VARCHAR(50) NULL COMMENT '현재 칭호(예: 승리요정)',

  -- Soft Delete (방장 탈퇴 시 방 보존을 위해 user row는 물리 삭제하지 않는 것을 권장)
  deleted_at DATETIME NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

  -- (선택) MySQL 8.0.16+ 에서 CHECK가 실제로 동작
  -- ,CHECK (win_rate >= 0.00 AND win_rate <= 100.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 2) Matches (경기 일정)
-- ==========================================
CREATE TABLE matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  sport ENUM('VOLLEYBALL','BASKETBALL') NOT NULL DEFAULT 'VOLLEYBALL',
  match_date DATETIME NOT NULL COMMENT '경기 시작 시간',

  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,

  location VARCHAR(100) NOT NULL,

  -- 점수 (MVP라도 점수판이 있으면 좋음)
  home_score INT NOT NULL DEFAULT 0,
  away_score INT NOT NULL DEFAULT 0,

  -- 경기 결과: PENDING(경기전), WIN(우리팀 승), LOSE(우리팀 패)
  -- 농구면 DRAW 추가 고려 가능
  result ENUM('PENDING','WIN','LOSE') NOT NULL DEFAULT 'PENDING',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_matches_date (match_date),
  KEY idx_matches_sport (sport),
  KEY idx_matches_result (result)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 3) Rooms (직관 동행 방)
-- ==========================================
CREATE TABLE rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  match_id BIGINT UNSIGNED NOT NULL,
  host_id  BIGINT UNSIGNED NOT NULL,

  title VARCHAR(100) NOT NULL,
  content TEXT NULL,

  -- 필터링용 좌석 정보 (선택)
  seat_area  VARCHAR(50) NULL COMMENT 'E구역, 블루존',
  seat_block VARCHAR(50) NULL COMMENT '100블럭',
  seat_row   VARCHAR(50) NULL COMMENT '3열',

  max_count INT NOT NULL DEFAULT 4,

  -- 승인제 여부 (현재는 승인제 고정이어도, 확장 대비 유지)
  is_approval_required TINYINT(1) NOT NULL DEFAULT 1,

  -- 방 상태 (검색 노출 제어용)
  status ENUM('OPEN','FULL','CLOSED','DELETED') NOT NULL DEFAULT 'OPEN',

  closed_at DATETIME NULL,
  deleted_at DATETIME NULL COMMENT 'Soft Delete',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_rooms_match FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  -- [중요] 방장이 탈퇴해도 방 기록은 남아야 하므로 CASCADE 하지 않음 (User Soft Delete 권장)
  CONSTRAINT fk_rooms_host  FOREIGN KEY (host_id)  REFERENCES users(id),

  KEY idx_rooms_match_status (match_id, status),
  KEY idx_rooms_host (host_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 4) User_Rooms (참여 멤버 및 대기열) - 핵심
-- ==========================================
CREATE TABLE user_rooms (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  user_id BIGINT UNSIGNED NOT NULL,
  room_id BIGINT UNSIGNED NOT NULL,

  -- 참여 상태 (Timeline 순서)
  -- PENDING: 신청함 (대기열)
  -- CANCELLED: 신청 취소함
  -- REJECTED: 방장이 거절함 (해당 방 재신청 불가)
  -- JOINED: 승인됨 & 참여중 (채팅 가능)
  -- LEFT: 스스로 나감 (재신청 가능 정책)
  -- KICKED: 방장이 강퇴함 (해당 방 재신청 불가)
  status ENUM('PENDING','CANCELLED','REJECTED','JOINED','LEFT','KICKED') NOT NULL DEFAULT 'PENDING',

  role ENUM('HOST','GUEST') NOT NULL DEFAULT 'GUEST',

  message VARCHAR(255) NULL COMMENT '신청 시 한 줄 메시지',

  -- 시간 컬럼(운영/디버깅용)
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '신청 일시',
  decided_at   DATETIME NULL COMMENT '승인/거절/강퇴 일시',
  joined_at    DATETIME NULL COMMENT 'JOINED 전환 일시(=승인 일시)',
  left_at      DATETIME NULL COMMENT 'LEFT/KICKED 전환 일시',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_rooms_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_rooms_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,

  -- [핵심 제약조건] 한 유저는 한 방에 오직 하나의 상태만 가짐 (History가 아닌 상태 업데이트 방식)
  UNIQUE KEY unique_user_room (user_id, room_id),

  -- 쿼리 성능 최적화 인덱스
  KEY idx_user_rooms_room_status (room_id, status),
  KEY idx_user_rooms_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 5) Room Messages (채팅)
-- ==========================================
CREATE TABLE room_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  room_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,

  type ENUM('TEXT','SYSTEM') NOT NULL DEFAULT 'TEXT',
  content TEXT NOT NULL COMMENT 'TEXT는 64KB 제한. 더 길면 LONGTEXT 고려',

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_room_messages_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_room_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  KEY idx_room_messages_room_created (room_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================
-- 6) Ticket Auths (직관 인증 - Optional)
-- ==========================================
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
