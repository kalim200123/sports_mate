"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [ageGroup, setAgeGroup] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return alert("닉네임을 입력해주세요.");
    if (!gender) return alert("성별을 선택해주세요.");
    if (!ageGroup) return alert("연령대를 선택해주세요.");

    setIsLoading(true);
    try {
      // CredentialsProvider ("Mock Login") 호출
      const result = await signIn("credentials", {
        nickname: nickname,
        gender: gender,
        ageGroup: ageGroup,
        redirect: false,
      });

      if (result?.error) {
        alert("로그인 실패: " + result.error);
      } else {
        // 로그인 성공 시 메인 또는 프로필로 이동
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      alert("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center font-bold text-red-600">Sports Mate (Dev)</CardTitle>
          <CardDescription className="text-center">개발용 Mock 로그인 (닉네임 + 정보 입력)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                닉네임
              </label>
              <Input
                id="nickname"
                placeholder="예: 승리요정"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">성별</label>
              <Select value={gender} onValueChange={(v: "MALE" | "FEMALE") => setGender(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="성별 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">남성</SelectItem>
                  <SelectItem value="FEMALE">여성</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">연령대</label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="연령대 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10대">10대</SelectItem>
                  <SelectItem value="20대">20대</SelectItem>
                  <SelectItem value="30대">30대</SelectItem>
                  <SelectItem value="40대">40대</SelectItem>
                  <SelectItem value="50대 이상">50대 이상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인 / 가입"}
            </Button>
          </form>
          <div className="mt-4 text-center text-xs text-gray-500">* 입력한 정보로 계정이 생성됩니다.</div>
        </CardContent>
      </Card>
    </div>
  );
}
