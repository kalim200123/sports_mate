export const MEN_TEAMS = ["대한항공", "현대캐피탈", "한국전력", "우리카드", "OK저축은행", "KB손해보험", "삼성화재"];

export const WOMEN_TEAMS = [
  "흥국생명",
  "현대건설",
  "정관장",
  "GS칼텍스",
  "IBK기업은행",
  "한국도로공사",
  "페퍼저축은행",
];

export const BASKETBALL_MEN_TEAMS = [
  "DB",
  "삼성",
  "SK",
  "LG",
  "소노",
  "KCC",
  "정관장",
  "KT",
  "한국가스공사",
  "현대모비스",
];

export const BASKETBALL_WOMEN_TEAMS = ["삼성생명", "신한은행", "우리은행", "하나은행", "BNK 썸", "KB스타즈"];

// Combine for helper types if needed, or keep separate.
// Existing ALL_TEAMS (Volleyball only for now, or update logic)
export const VOLLEYBALL_TEAMS = [...MEN_TEAMS, ...WOMEN_TEAMS];
export const BASKETBALL_TEAMS = [...BASKETBALL_MEN_TEAMS, ...BASKETBALL_WOMEN_TEAMS];
export const ALL_TEAMS = [...VOLLEYBALL_TEAMS, ...BASKETBALL_TEAMS];

export const CHEERING_STYLES = [
  "목청 황제 📢",
  "전략 분석가 🧐",
  "먹방 러버 🍕",
  "조용히 집중 🤫",
  "리액션 부자 🤩",
  "새싹 뉴비 🌱",
  "유니폼 수집가 👕",
  "응원가 마스터 🎵",
  "포토그래퍼 📸",
  "사교적인 팬 🤝",
];

export const TITLES = [
  { id: "newbie", name: "신입 메이트", description: "가입 시 기본 제공", condition: "기본" },
  { id: "debut", name: "직관 데뷔", description: "첫 직관 인증 완료", condition: "직관 1회 이상" },
  { id: "pro_visit", name: "프로 직관러", description: "열정적인 배구 팬", condition: "직관 5회 이상" },
  { id: "victory_fairy", name: "승리 요정", description: "내가 가면 이긴다!", condition: "승률 60% 이상 (5경기 이상)" },
  { id: "unbreakable", name: "꺾이지 않는 마음", description: "졌지만 잘 싸웠다...", condition: "패배 5회 이상" },
  // Dynamic titles like "True Fan" will be handled by logic
];
