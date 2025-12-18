# MySQL DB Schema 설명서

## 반영된 요구사항

- **Users 확장 프로필**: `profile_image_url`, `my_team`, `region`, `avatar_id` 추가
- **Users Soft Delete**: `users.deleted_at`
- **Matches 점수 및 상태**: `matches.home_score`, `matches.away_score`, `matches.status`
- **Rooms 지역 및 공지**: `rooms.region`, `rooms.notice`, `rooms.ticket_status`
- **User Rooms 읽기 추적**: `user_rooms.last_read_at`
- **Ticket Auth 메모**: `ticket_auths.content`
- **JSON 기본값**: `users.cheering_styles JSON NOT NULL`
- **Timezone 주의**: `SET time_zone`는 권한/환경에 따라 실패 가능 → RDS 파라미터 그룹 설정 권장

---

## 핵심 정책/로직(DB 관점)

### 1) 방 상태(rooms.status)

- `OPEN`: 모집 중
- `FULL`: 정원 도달 (대기 신청은 가능)
- `CLOSED`: 모집 종료
- `DELETED`: 삭제/해산 (soft delete)

### 2) 참여자 상태(user_rooms.status) - 단일 상태

- `PENDING`: 신청/대기열
- `CANCELLED`: 신청 취소
- `REJECTED`: 거절 (해당 방 재신청 불가)
- `JOINED`: 승인 즉시 참여 (채팅 가능)
- `LEFT`: 자발적 퇴장 (재신청 가능)
- `KICKED`: 강퇴 (해당 방 재신청 불가)

### 3) 재신청 불가(방 단위)

- `REJECTED` 또는 `KICKED`인 유저는 **그 방에는 끝까지 재신청 불가**
- 다른 방에는 신청 가능

### 4) 신청/참여 단일 레코드 보장

- `UNIQUE(user_id, room_id)`로 한 유저는 한 방에 하나의 상태만 가짐
- 재신청/변경은 "INSERT가 아니라 UPDATE" 방식으로 처리

---

## 테이블 요약

### users

- 카카오 로그인(`kakao_id`) + 기본 프로필 + 태그(JSON) + soft delete
- **확장 프로필**:
  - `profile_image_url`: 프로필 이미지 URL
  - `my_team`: 응원하는 팀 (예: "현대건설", "삼성(농구)")
  - `region`: 활동 지역 (예: "서울", "대전", "부산")
  - `avatar_id`: 기본 아바타 ID
- `cheering_styles`는 JSON 배열 (예: `["목청 황제 📢", "조용히 집중 🤫"]`)
- **Gamification**:
  - `win_count`, `loss_count`: 승/패 횟수
  - `win_rate`: 승률 (0.00 ~ 100.00)
  - `total_visits`: 총 직관 횟수
  - `title`: 현재 칭호 (예: "승리 요정", "프로 직관러")

### matches

- 종목(`sport`: VOLLEYBALL/BASKETBALL), 날짜, 홈/원정 팀명, 장소, 점수
- **경기 상태** (`status`):
  - `SCHEDULED`: 예정
  - `LIVE`: 진행 중
  - `COMPLETED`: 종료
  - `CANCELLED`: 취소

### rooms

- 경기별 동행 방 (정원/승인제/상태/soft delete)
- **티켓 정보**: `ticket_status` (RESERVED/NOT_RESERVED)
- **지역 및 공지**:
  - `region`: 방 지역 (예: "서울", "대전")
  - `notice`: 방 공지사항 (채팅방 상단에 표시)
- **상태 관리**: `status` (OPEN/FULL/CLOSED/DELETED)

### user_rooms (핵심)

- 신청/대기열/승인/참여/퇴장/강퇴 상태를 한 테이블에서 관리
- **시간 추적**:
  - `requested_at`: 신청 일시
  - `decided_at`: 승인/거절/강퇴 일시
  - `joined_at`: 참여(승인) 일시
  - `left_at`: 퇴장/강퇴 일시
- **읽기 추적**: `last_read_at` (마지막 읽은 시각, 읽지 않은 메시지 카운트 계산용)
- **역할**: `role` (HOST/GUEST)

### room_messages

- 방 채팅 로그
- **메시지 타입**: `type` (TEXT/SYSTEM)
- `message_type`: 추가 분류용 필드

### ticket_auths

- 직관 인증 (경기당 유저 1회 제한: `UNIQUE(user_id, match_id)`)
- **인증 정보**:
  - `image_url`: 티켓 이미지
  - `content`: 인증 메모/설명
  - `status`: PENDING/APPROVED/REJECTED

---

## 운영/개발 메모

### 방 관리

- **FULL이어도 신청(PENDING) 허용** → UI는 "대기 신청"으로 표시
- 중복 참여 방지 (한 경기에서 JOINED는 1개) + 마지막 자리 동시 승인 방지는 **API 트랜잭션에서 처리**
- **공식 응원 채팅방**: `title = 'OFFICIAL_CHAT'`으로 구분, 자동 입장 처리

### 인증 및 통계

- 직관 인증 승인 시 `users.total_visits` 증가
- 경기 결과에 따라 `win_count` 또는 `loss_count` 증가
- `win_rate` 재계산: `(win_count / (win_count + loss_count)) * 100`

### 타임존

- RDS 등에서 `time_zone` 설정은 SQL이 실패할 수 있으니 **DB 파라미터 그룹**으로 관리 권장
- 애플리케이션에서 `date-fns` 등을 사용하여 클라이언트 타임존 처리

### 확장 고려사항

- **신고 시스템**: 별도 `reports` 테이블 추가 고려
- **매너 온도**: 방 참여자 평가 시스템 추가 가능
- **알림**: `notifications` 테이블로 푸시/인앱 알림 관리
