"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId: number;
}

export default function CreateRoomModal({ isOpen, onClose, matchId }: CreateRoomModalProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    location: string;
    ticket_status: "RESERVED" | "NOT_RESERVED";
    max_count: number;
    is_approval_required: boolean;
  }>({
    title: "",
    content: "",
    location: "",
    ticket_status: "NOT_RESERVED",
    max_count: 4,
    is_approval_required: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace with actual logged-in user ID
      const HOST_ID = 1;

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_id: matchId,
          host_id: HOST_ID,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error("Failed to create room");

      const data = await response.json();
      console.log("Room created:", data.roomId);
      onClose();
      // 방 생성 후 해당 방 상세 페이지(채팅방)로 이동
      router.push(`/rooms/${data.roomId}`);
    } catch (error) {
      console.error(error);
      alert("방 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold">방 만들기 🏟️</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              방 제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={50}
              placeholder="예: E구역 100블럭 직관하실 분!"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-zinc-800 text-sm"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Location (Merged) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">위치 (선택)</label>
            <input
              type="text"
              maxLength={50}
              placeholder="예: E구역 100블럭, 3루 응원석 등"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-zinc-800 text-sm"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          {/* Ticket Status & Max Count */}
          <div className="grid grid-cols-2 gap-4">
            {/* Ticket Status */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold">예매 유무</label>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ticket_status: "NOT_RESERVED" })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    formData.ticket_status === "NOT_RESERVED"
                      ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  미예매
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ticket_status: "RESERVED" })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    formData.ticket_status === "RESERVED"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  예매 완료
                </button>
              </div>
            </div>

            {/* Max Count */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold">최대 인원</label>
              <select
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm"
                value={formData.max_count}
                onChange={(e) => setFormData({ ...formData, max_count: Number(e.target.value) })}
              >
                {[2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num}명
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Admission Method (Hidden/Fixed) */}
          <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              방장 승인 후 입장 가능한 <b>승인제</b> 방입니다.
            </span>
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              소개글 <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              maxLength={500}
              placeholder="직관 스타일이나 만날 시간 등을 적어주세요!"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-zinc-800 text-sm resize-none"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "생성 중..." : "방 만들기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
