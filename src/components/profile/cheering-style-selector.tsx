"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheeringStyle } from "@/types/db";

interface CheeringStyleSelectorProps {
  selectedStyles: CheeringStyle[];
  onChange: (styles: CheeringStyle[]) => void;
}

const AVAILABLE_STYLES: { label: CheeringStyle; desc: string }[] = [
  { label: "#조용히집중", desc: "경기 분석하며 조용히 관람" },
  { label: "#열정응원", desc: "목청 터져라 응원가 부르기" },
  { label: "#촬영러", desc: "선수들 사진/영상 찍기 바쁨" },
  { label: "#먹방러", desc: "맛있는 거 먹으러 왔어요" },
  { label: "#유니폼풀장착", desc: "응원 도구 완비" },
  { label: "#뉴비환영", desc: "모르는 거 알려드려요" },
];

export function CheeringStyleSelector({ selectedStyles, onChange }: CheeringStyleSelectorProps) {
  const toggleStyle = (style: CheeringStyle) => {
    if (selectedStyles.includes(style)) {
      onChange(selectedStyles.filter((s) => s !== style));
    } else {
      onChange([...selectedStyles, style]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_STYLES.map((item) => {
          const isSelected = selectedStyles.includes(item.label);
          return (
            <Badge
              key={item.label}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm transition-all",
                isSelected ? "bg-red-600 hover:bg-red-700" : "text-gray-600 hover:bg-gray-100"
              )}
              onClick={() => toggleStyle(item.label)}
            >
              {item.label}
            </Badge>
          );
        })}
      </div>
      <p className="text-xs text-gray-500">* 선택한 스타일: {selectedStyles.length}개</p>
    </div>
  );
}
