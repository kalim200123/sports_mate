"use client";

import { CheeringStyleSelector } from "@/components/profile/cheering-style-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheeringStyle } from "@/types/db";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [ageGroup, setAgeGroup] = useState("");
  const [styles, setStyles] = useState<CheeringStyle[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 초기 데이터 로딩 (실제로는 API 호출 필요 - MVP에서는 세션 정보나 Mock 데이터로 대체 가능하지만, API 구현 권장)
  // 여기서는 편의상 생성 시 기본값에서 시작한다고 가정
  useEffect(() => {
    if (session?.user?.name) {
      setNickname(session.user.name);
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gender) return alert("성별을 선택해주세요.");

    setIsSaving(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          gender, // "MALE" | "FEMALE"
          age_group: ageGroup,
          cheering_styles: styles,
        }),
      });

      if (!response.ok) {
        throw new Error("프로필 저장 실패");
      }

      alert("프로필이 저장되었습니다.");
      router.push("/");
      router.refresh(); // 세션/데이터 갱신
    } catch (error) {
      console.error(error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="container max-w-lg mx-auto p-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>프로필 수정</CardTitle>
          <CardDescription>동행 매칭을 위해 기본 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </div>

            {/* 성별 */}
            <div className="space-y-2">
              <Label>성별 (필수)</Label>
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

            {/* 연령대 */}
            <div className="space-y-2">
              <Label>연령대</Label>
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

            {/* 응원 스타일 */}
            <div className="space-y-2">
              <Label>나의 직관 스타일 (중복 선택 가능)</Label>
              <CheeringStyleSelector selectedStyles={styles} onChange={setStyles} />
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? "저장 중..." : "저장하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
