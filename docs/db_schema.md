# MySQL DB Schema (MVP) 설명서

## 반영된 요구사항

- Users Soft Delete: `users.deleted_at`
- Matches 점수: `matches.home_score`, `matches.away_score`
- JSON 기본값: `users.cheering_styles JSON NOT NULL DEFAULT (JSON_ARRAY())`
- Timezone 주의: `SET time_zone`는 권한/환경에 따라 실패 가능 → RDS 파라미터 그룹 설정 권장

---

## 핵심 정책/로직(DB 관점)

### 1) 방 상태(room.status)

- `OPEN`: 모집 중
- `FULL`: 정원 도달(하지만 **대기 신청은 가능** 정책)
- `CLOSED`: 모집 종료
- `DELETED`: 삭제/해산(soft delete)

### 2) 참여자 상태(user_rooms.status) - 단일 상태

- `PENDING`: 신청/대기열
- `CANCELLED`: 신청 취소
- `REJECTED`: 거절(해당 방 재신청 불가)
- `JOINED`: 승인 즉시 참여(채팅 가능)
- `LEFT`: 자발적 퇴장(재신청 가능 정책)
- `KICKED`: 강퇴(해당 방 재신청 불가)

### 3) 재신청 불가(방 단위)

- `REJECTED` 또는 `KICKED`인 유저는 **그 방에는 끝까지 재신청 불가**
- 다른 방에는 신청 가능

### 4) 신청/참여 단일 레코드 보장

- `UNIQUE(user_id, room_id)`로 한 유저는 한 방에 하나의 상태만 가짐
- 재신청/변경은 “INSERT가 아니라 UPDATE” 방식으로 처리

---

## 테이블 요약

### users

- 카카오 로그인(`kakao_id`) + 기본 프로필 + 태그(JSON) + soft delete
- `cheering_styles`는 JSON 배열(기본값: `[]`)

### matches

- 종목, 날짜, 홈/원정 팀명, 장소, 점수, 결과

### rooms

- 경기별 동행 방(정원/승인제/좌석정보/상태/soft delete)

### user_rooms (핵심)

- 신청/대기열/승인/참여/퇴장/강퇴 상태를 한 테이블에서 관리
- `requested_at/decided_at/joined_at/left_at`로 액션 시점을 기록

### room_messages

- 방 채팅 로그

### ticket_auths (optional)

- 직관 인증(경기당 유저 1회 제한: `UNIQUE(user_id, match_id)`)

---

## 운영/개발 메모(꼭 읽기)

- FULL이어도 신청(PENDING) 허용 → UI는 “대기 신청”
- 중복 참여 방지(한 경기에서 JOINED는 1개) + 마지막 자리 동시 승인 방지는 **API 트랜잭션에서 처리**
- RDS 등에서 time_zone 설정은 SQL이 실패할 수 있으니 DB 파라미터 그룹으로 관리 권장
