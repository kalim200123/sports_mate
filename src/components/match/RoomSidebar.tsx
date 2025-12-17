"use client";

import Image from "next/image";
import { useState } from "react";

interface User {
  userId?: number;
  nickname: string;
  avatar_url: string;
}

interface RoomSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  joinedUsers: User[];
  pendingUsers: User[];
  isHost: boolean;
  hostId?: number;
  currentUserId?: number;
  noticeContent: string;
  roomStatus: string;
  onUpdateNotice: (text: string) => void;
  onKick: (userId: number) => void;
  onApprove: (userId: number) => void;
  onLeave: () => void;
  onCloseRecruitment: () => void;
}

export default function RoomSidebar({
  isOpen,
  onClose,
  joinedUsers,
  pendingUsers,
  isHost,
  hostId,
  currentUserId,
  noticeContent,
  roomStatus,
  onUpdateNotice,
  onKick,
  onApprove,
  onLeave,
  onCloseRecruitment,
}: RoomSidebarProps) {
  const [notice, setNotice] = useState(noticeContent);
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  const handleSaveNotice = () => {
    onUpdateNotice(notice);
    setIsEditingNotice(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="absolute inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />}

      {/* Sidebar */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-white dark:bg-zinc-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out border-l border-zinc-200 dark:border-zinc-800 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <h2 className="font-bold text-lg">메뉴</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 1. Notice */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm text-zinc-500">📢 공지사항</h3>
              {isHost && (
                <button
                  onClick={() => (isEditingNotice ? handleSaveNotice() : setIsEditingNotice(true))}
                  className="text-xs text-blue-600 font-medium hover:underline"
                >
                  {isEditingNotice ? "저장" : "수정"}
                </button>
              )}
            </div>
            {isEditingNotice ? (
              <textarea
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                className="w-full p-2 text-sm border rounded-lg bg-zinc-50 dark:bg-zinc-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="공지사항을 입력하세요..."
              />
            ) : (
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm whitespace-pre-wrap min-h-[80px] text-zinc-700 dark:text-zinc-300">
                {notice || "등록된 공지사항이 없습니다."}
              </div>
            )}
          </section>

          {/* 2. Pending Users (Host Only) */}
          {isHost && pendingUsers.length > 0 && (
            <section>
              <h3 className="font-bold text-sm text-zinc-500 mb-2">⏳ 승인 대기 ({pendingUsers.length})</h3>
              <ul className="space-y-2">
                {pendingUsers.map((user, i) => (
                  <li
                    key={user.userId || i}
                    className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden">
                        {user.avatar_url ? (
                          <Image src={user.avatar_url} alt={user.nickname} width={32} height={32} />
                        ) : (
                          <span className="flex items-center justify-center h-full w-full">{user.nickname[0]}</span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{user.nickname}</span>
                    </div>
                    <button
                      onClick={() => user.userId && onApprove(user.userId)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700"
                    >
                      승인
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 3. Joined Users */}
          <section>
            <h3 className="font-bold text-sm text-zinc-500 mb-2">👥 참여자 ({joinedUsers.length})</h3>
            <ul className="space-y-3">
              {joinedUsers.map((user, i) => (
                <li key={user.userId || i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-200 overflow-hidden relative">
                      {/* Host Badge */}
                      {user.userId === hostId && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                      )}
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={user.nickname}
                          width={36}
                          height={36}
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex items-center justify-center h-full w-full">{user.nickname[0]}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium block">
                        {user.nickname}
                        {user.userId === hostId && (
                          <span className="ml-1 text-xs text-yellow-600 dark:text-yellow-400 font-bold">👑 방장</span>
                        )}
                      </span>
                      {user.userId === currentUserId && <span className="text-xs text-zinc-400">(나)</span>}
                    </div>
                  </div>
                  {isHost && user.userId !== currentUserId && (
                    <button
                      onClick={() => user.userId && onKick(user.userId)}
                      className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      강퇴
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-2">
          {isHost && roomStatus === "OPEN" && (
            <button
              onClick={onCloseRecruitment}
              className="w-full py-3 bg-zinc-800 dark:bg-zinc-700 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
            >
              ⛔ 모집 마감하기
            </button>
          )}
          <button
            onClick={onLeave}
            className="w-full py-3 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-200 transition-colors"
          >
            방 나가기
          </button>
        </div>
      </div>
    </>
  );
}
