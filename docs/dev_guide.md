# Project Development Guide: Sports Mate Matching Service (MVP)

## 1. 프로젝트 개요

- **서비스명:** 스포츠 직관 동행 매칭 서비스 (MVP)
- **핵심 타겟:** 대전 정관장 레드스파크스(여자 배구) 팬
- **목적:** 혼자 직관하는 팬들이 자신의 성격과 응원 스타일(#조용히집중, #열정응원 등)에 맞는 동행을 쉽고 빠르게 구하는 것.
- **핵심 가치:** 1:1 DM의 피로도를 줄이고, '방(Room)' 기반의 신뢰할 수 있는 동행 매칭 제공.

## 2. 기술 스택 (Tech Stack)

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** MySQL
- **DB Client:** `mysql2` (recommend) or `TypeORM` / `Drizzle` (Team choice)
- **Styling:** Tailwind CSS + Shadcn/UI
- **State Management:** Zustand, React Query
- **Auth:** Auth.js (NextAuth)

## 3. 아키텍처 원칙 (중요!)

> Team Leader's Request: 추후 NestJS 마이그레이션을 고려하여 비즈니스 로직을 분리할 것.

- **Controller (Route Handlers):** `app/api/...`
  - 요청(Request) 수신, 유효성 검사, Service 호출, 응답(Response) 반환만 담당.
- **Service Layer:** `src/services/...`
  - 실제 비즈니스 로직(매칭, 승률 계산, 방 생성 등)을 수행.
  - Prisma Client를 여기서 호출.
  - _나중에 이 폴더의 파일들을 NestJS의 Provider로 옮길 수 있어야 함._

### 폴더 구조 예시

`src/
├── app/
│   ├── api/          # Controller 역할
│   └── (pages)/      # UI Page Components
├── services/         # Business Logic (핵심!)
│   ├── room.service.ts
│   ├── user.service.ts
│   └── chat.service.ts
├── lib/
│   ├── prisma.ts     # DB Connection
│   └── utils.ts
├── components/       # Shadcn UI & Common Components
└── types/            # TypeScript Interfaces`

## 4. PWA 및 모바일 최적화 요구사항

- **App-like Feel:** 하단 탭 내비게이션(Bottom Tab Navigation) 적용.
- **채팅 UX:**
  - 채팅방에서 뒤로가기 시 연결이 끊기지 않거나, 재진입 시 빠르게 복구되어야 함.
  - 앱이 백그라운드에 있을 때 푸시 알림(Web Push) 지원 필요.
- **SEO/GEO:** `metadata` 및 JSON-LD(Schema.org)를 사용하여 경기 일정 및 모집 글이 검색엔진/AI에 잘 노출되도록 설정.

## 5. 개발 우선순위 (Development Phase)

1. **Setup:** Next.js + PWA + Prisma + DB 세팅.
2. **Auth & User:** 카카오 로그인 및 프로필(응원 스타일 태그) 입력 구현.
3. **Room Core:** 방 생성, 리스트 조회, 상세 조회.
4. **Participation Logic:** 신청(`PENDING`) -> 승인(`JOINED`) 로직 구현 (**가장 중요**, `room_logic_guide.md` 참조).
5. **Chat:** Socket.io 또는 Pusher를 이용한 실시간 채팅.
6. **Gamification:** 승률 계산 및 칭호 부여 로직.
