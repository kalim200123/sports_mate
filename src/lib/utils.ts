import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarUrl(avatarId: number): string {
  // Default to 1 if invalid or null
  const validId = avatarId && avatarId > 0 && avatarId <= 10 ? avatarId : 1;
  return `/avatars/${validId}.png`;
}

export const getTeamColor = (teamName: string) => {
  if (teamName.includes("대한항공")) return "bg-[#0065b3]";
  if (teamName.includes("현대캐피탈")) return "bg-[#000000]";
  if (teamName.includes("한국전력")) return "bg-[#d6001a]";
  if (teamName.includes("우리카드")) return "bg-[#008485]";
  if (teamName.includes("OK금융그룹")) return "bg-[#ff6600]";
  if (teamName.includes("KB손해보험")) return "bg-[#ffcd00]";
  if (teamName.includes("삼성화재")) return "bg-[#0b4ea2]";

  // Women
  if (teamName.includes("흥국생명")) return "bg-[#ea007e]";
  if (teamName.includes("현대건설")) return "bg-[#003764]";
  if (teamName.includes("정관장")) return "bg-[#cf0a2c]";
  if (teamName.includes("GS")) return "bg-[#009088]";
  if (teamName.includes("IBK")) return "bg-[#0f0f70]";
  if (teamName.includes("도로공사")) return "bg-[#002d72]";
  if (teamName.includes("페퍼")) return "bg-[#ed1c24]";

  return "bg-gray-500";
};

export function getTeamEmblem(teamName: string) {
  // Men
  if (teamName.includes("현대캐피탈")) return "https://cdn.dev.kovo.co.kr/favicons/skywalkers.svg";
  if (teamName.includes("대한항공")) return "https://cdn.dev.kovo.co.kr/favicons/jumbos.svg";
  if (teamName.includes("KB")) return "https://cdn.dev.kovo.co.kr/favicons/stars.svg";
  if (teamName.includes("우리카드")) return "https://cdn.dev.kovo.co.kr/favicons/wooriwon.svg";
  if (teamName.includes("삼성화재")) return "https://cdn.dev.kovo.co.kr/favicons/bluefangs.svg";
  if (teamName.includes("한국전력")) return "https://cdn.dev.kovo.co.kr/favicons/vixtorm.svg";
  if (teamName.includes("OK")) return "https://cdn.dev.kovo.co.kr/favicons/okman.svg";

  // Women
  if (teamName.includes("흥국생명")) return "https://cdn.dev.kovo.co.kr/favicons/pinkspiders.svg";
  if (teamName.includes("정관장")) return "https://cdn.dev.kovo.co.kr/favicons/redsparks.svg";
  if (teamName.includes("현대건설")) return "https://cdn.dev.kovo.co.kr/favicons/hillstate.svg";
  if (teamName.includes("IBK")) return "https://cdn.dev.kovo.co.kr/favicons/altos.svg";
  if (teamName.includes("도로공사")) return "https://cdn.dev.kovo.co.kr/favicons/hipass.svg";
  if (teamName.includes("GS")) return "https://cdn.dev.kovo.co.kr/favicons/kixx.svg";
  if (teamName.includes("페퍼")) return "https://cdn.dev.kovo.co.kr/favicons/peppers.svg";

  return "/icons/volleyball.png"; // Fallback
}
