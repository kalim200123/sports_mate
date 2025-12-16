# 방/대기열 SQL 템플릿 (MySQL 8 / InnoDB)

> 목적: MVP 방 로직(대기열, 승인 즉시 JOINED, 방 단위 재신청 불가, 한 경기당 PENDING 3개, 중복 JOINED 방지, Last Seat 동시성 방지)을 **Raw SQL**로 바로 구현할 수 있게 템플릿 제공

---

## 공통 전제(정책)

- FULL이어도 신청(PENDING) 가능(대기열)
- 한 경기당 `PENDING` 최대 3개 (API에서 체크)
- `REJECTED`/`KICKED` 상태면 **해당 방 재신청 불가**
- 승인 = 즉시 `JOINED`
- 한 경기에서 `JOINED`는 1개만 (Option B: 승인 시점 방어)
- `user_rooms`는 `UNIQUE(user_id, room_id)`로 1행 유지(상태 업데이트 방식)

---

## 0) 유틸 쿼리

### 0-1. 방 기본 정보 조회

sql
SELECT match_id, status, max_count
FROM rooms
WHERE id = ? AND deleted_at IS NULL;

### 0-2. 방 현재 참여 인원(JOINED) 수

sql
코드 복사
SELECT COUNT(\*) AS joined_count
FROM user_rooms
WHERE room_id = ?
AND status = 'JOINED';

0-3. 한 경기에서 유저의 PENDING 개수(=3개 제한)
sql
코드 복사
SELECT COUNT(\*) AS pending_count
FROM user_rooms ur
JOIN rooms r ON r.id = ur.room_id
WHERE ur.user_id = ?
AND r.match_id = ?
AND ur.status = 'PENDING'
AND r.status <> 'DELETED'
AND r.deleted_at IS NULL;

### 0-4. 한 경기에서 유저가 이미 JOINED인지 체크(중복 참여 방지)

sql
코드 복사
SELECT COUNT(\*) AS joined_any
FROM user_rooms ur
JOIN rooms r ON r.id = ur.room_id
WHERE ur.user_id = ?
AND r.match_id = ?
AND ur.status = 'JOINED'
AND r.status <> 'DELETED'
AND r.deleted_at IS NULL;

### 1) 방 생성 (rooms 생성 + 방장 자동 JOINED)

권장: 방 생성 시 방장도 user_rooms에 role=HOST, status=JOINED로 자동 참여 처리

#### 1-1. rooms 생성

sql
코드 복사
INSERT INTO rooms (
match_id, host_id, title, content,
seat_area, seat_block, seat_row,
max_count, is_approval_required, status
) VALUES (
?, ?, ?, ?,
?, ?, ?,
?, ?, 'OPEN'
);

#### 1-2. 방장 자동 JOINED 생성

sql
코드 복사
INSERT INTO user_rooms (
user_id, room_id, status, role,
requested_at, decided_at, joined_at
) VALUES (
?, ?, 'JOINED', 'HOST',
NOW(), NOW(), NOW()
);
위 2개 쿼리는 트랜잭션으로 묶는 것을 권장합니다.

### 2) 신청(대기 신청 포함)

#### 2-1. 재신청 불가 체크(필수)

sql
코드 복사
SELECT status
FROM user_rooms
WHERE user_id = ? AND room_id = ?;
status가 REJECTED/KICKED이면 신청 차단

#### 2-2. 최초 신청 INSERT

sql
코드 복사
INSERT INTO user_rooms (
user_id, room_id, status, role, message, requested_at
) VALUES (
?, ?, 'PENDING', 'GUEST', ?, NOW()
);

#### 2-3. 재신청 UPDATE (이전에 CANCELLED/LEFT였던 유저를 다시 PENDING으로)

sql
코드 복사
UPDATE user_rooms
SET status = 'PENDING',
message = ?,
requested_at = NOW(),
decided_at = NULL,
joined_at = NULL,
left_at = NULL
WHERE user_id = ?
AND room_id = ?
AND status IN ('CANCELLED','LEFT');

#### 2-4. 신청 취소 (PENDING → CANCELLED)

sql
코드 복사
UPDATE user_rooms
SET status = 'CANCELLED',
left_at = NOW()
WHERE user_id = ?
AND room_id = ?
AND status = 'PENDING';

#### 2-5. 방장 거절 (PENDING → REJECTED)

sql
코드 복사
UPDATE user_rooms
SET status = 'REJECTED',
decided_at = NOW()
WHERE user_id = ?
AND room_id = ?
AND status = 'PENDING';

### 5) 방장 승인 (PENDING → JOINED) — 트랜잭션 필수

“Last Seat(동시 승인)” + “중복 JOINED 방지”를 위해 반드시 트랜잭션으로 처리합니다.

트랜잭션 내부 실행 순서(권장)
rooms row 잠금(상태/정원/삭제 여부 확인)

한 경기에서 이미 JOINED인지 체크(중복 참여 방지)
현재 JOINED 수 < max_count 체크(정원 재확인)
user_rooms: PENDING → JOINED 업데이트
rooms.status를 FULL/OPEN으로 갱신(옵션)

#### 5-1. 방 row 락

sql
코드 복사
SELECT id, match_id, max_count, status, deleted_at
FROM rooms
WHERE id = ?
FOR UPDATE;
status가 CLOSED/DELETED면 승인 실패 처리 권장

#### 5-2. 중복 참여 체크(한 경기 JOINED 1개)

sql
코드 복사
SELECT COUNT(\*) AS joined_any
FROM user_rooms ur
JOIN rooms r ON r.id = ur.room_id
WHERE ur.user_id = ?
AND r.match_id = ?
AND ur.status = 'JOINED'
AND r.deleted_at IS NULL
AND r.status <> 'DELETED';
joined_any > 0 이면 승인 실패

#### 5-3. 정원 체크 (현재 JOINED 수)

sql
코드 복사
SELECT COUNT(\*) AS joined_count
FROM user_rooms
WHERE room_id = ?
AND status = 'JOINED'
FOR UPDATE;
joined_count >= max_count 이면 승인 실패

#### 5-4. 승인 업데이트

sql
코드 복사
UPDATE user_rooms
SET status = 'JOINED',
decided_at = NOW(),
joined_at = NOW()
WHERE user_id = ?
AND room_id = ?
AND status = 'PENDING';
affectedRows=1 이어야 성공(0이면 이미 취소/처리된 상태)

#### 5-5. 방 상태 갱신(옵션)

sql
코드 복사
UPDATE rooms
SET status = CASE
WHEN (SELECT COUNT(\*) FROM user_rooms WHERE room_id = rooms.id AND status = 'JOINED') >= max_count THEN 'FULL'
ELSE 'OPEN'
END
WHERE id = ?;

### 6) 유저 나가기 (JOINED → LEFT)

sql
코드 복사
UPDATE user_rooms
SET status = 'LEFT',
left_at = NOW()
WHERE user_id = ?
AND room_id = ?
AND status = 'JOINED';

#### 6-1. 나간 뒤 rooms.status OPEN 복귀(옵션)

sql
코드 복사
UPDATE rooms
SET status = CASE
WHEN status = 'FULL' THEN 'OPEN'
ELSE status
END
WHERE id = ?
AND status <> 'CLOSED';

### 7) 방장 강퇴 (JOINED → KICKED)

sql
코드 복사
UPDATE user_rooms
SET status = 'KICKED',
decided_at = NOW(),
left_at = NOW()
WHERE user_id = ?
AND room_id = ?
AND status = 'JOINED';

#### 7-1. 강퇴 후 rooms.status OPEN 복귀(옵션)

sql
코드 복사
UPDATE rooms
SET status = CASE
WHEN status = 'FULL' THEN 'OPEN'
ELSE status
END
WHERE id = ?
AND status <> 'CLOSED';

### 8) 대표 조회 쿼리

#### 8-1. 방 대기열(PENDING) 리스트

sql
코드 복사
SELECT ur.user_id, u.nickname, u.gender, u.age_group, u.mbti, u.cheering_styles,
ur.message, ur.requested_at
FROM user_rooms ur
JOIN users u ON u.id = ur.user_id
WHERE ur.room_id = ?
AND ur.status = 'PENDING'
ORDER BY ur.requested_at ASC;

#### 8-2. 방 참여자(JOINED) 리스트

sql
코드 복사
SELECT ur.user_id, u.nickname, ur.role, ur.joined_at
FROM user_rooms ur
JOIN users u ON u.id = ur.user_id
WHERE ur.room_id = ?
AND ur.status = 'JOINED'
ORDER BY ur.joined_at ASC;

#### 8-3. 내 신청/참여 현황

sql
코드 복사
SELECT r.id AS room_id, r.title, r.status AS room_status, r.match_id,
ur.status AS my_status, ur.message,
ur.requested_at, ur.decided_at, ur.joined_at, ur.left_at
FROM user_rooms ur
JOIN rooms r ON r.id = ur.room_id
WHERE ur.user_id = ?
ORDER BY ur.updated_at DESC;

## 구현 메모(중요)

승인(5)은 반드시 트랜잭션으로 처리(Last Seat 방지)

rooms.status 갱신은 선택사항:

항상 정확한 상태가 필요하면 업데이트

단순화하려면 조회 시 JOINED count로 계산해도 됨(성능/정확도 트레이드오프)

::contentReference[oaicite:0]{index=0}

```

```
