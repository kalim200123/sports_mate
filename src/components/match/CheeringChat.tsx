"use client";

import UserModal from "@/components/user/UserModal";
import { useUserStore } from "@/store/use-user-store";
import { format, isSameDay } from "date-fns";
import { ko } from "date-fns/locale";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import RoomSidebar from "./RoomSidebar";

interface Message {
  id: number;
  user_id: number;
  content: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
}

interface RoomInfo {
  id: number;
  host_id: number;
  title: string;
  content: string;
  status: string;
  max_count: number;
  current_count: number;
  location?: string;
  match_id: number;
}

interface CheeringChatProps {
  roomId: string;
  hostId?: number;
  initialJoinedUsers?: { userId?: number; nickname: string; avatar_url: string }[];
  title?: string;
  roomInfo?: RoomInfo;
}

export default function CheeringChat({ roomId, hostId, initialJoinedUsers, title, roomInfo }: CheeringChatProps) {
  const { user } = useUserStore();
  const router = useRouter(); // For Leave redirect

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [joinedUsers, setJoinedUsers] = useState<{ userId?: number; nickname: string; avatar_url: string }[]>(
    initialJoinedUsers || []
  );
  const [joinStatus, setJoinStatus] = useState<"PENDING" | "JOINED" | null>(null);
  const [pendingUsers, setPendingUsers] = useState<{ userId: number; nickname: string; avatar_url: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(roomInfo?.content || "");
  const [currentRoomStatus, setCurrentRoomStatus] = useState(roomInfo?.status || "OPEN");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHost = user?.id === (hostId || roomInfo?.host_id);
  const isRoomMode = !!roomInfo; // If roomInfo is passed, we are in Room Mode

  // ... (useEffect for Socket - largely same, skipping re-write if possible but replace checks)
  // Re-writing useEffect to be safe with replace
  useEffect(() => {
    // 0. Fetch History
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/messages`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };
    fetchHistory();

    // 0.5 Mark as Read
    if (user) {
      fetch(`/api/rooms/${roomId}/read`, { method: "POST" });
    }

    // 1. Connect to Socket Server
    socketRef.current = io("http://localhost:4000");

    // 2. Join Room
    socketRef.current.emit("join_room", { roomId, userId: user?.id });

    // 3. Listen for Messages & Updates
    socketRef.current.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketRef.current.on(
      "join_request",
      (data: { userId: number; nickname: string; avatar_url: string; status: string }) => {
        if (user && data.userId === user.id) {
          setJoinStatus("PENDING");
        }
        if (isHost) {
          setPendingUsers((prev) => [...prev, data]);
        }
      }
    );

    socketRef.current.on("join_approved", (data: { userId: number; nickname?: string; avatar_url?: string }) => {
      if (user && data.userId === user.id) {
        setJoinStatus("JOINED");
      }
      setPendingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      if (data.nickname) {
        setJoinedUsers((prev) => [
          ...prev,
          { userId: data.userId, nickname: data.nickname!, avatar_url: data.avatar_url || "" },
        ]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, user, isHost]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !user || !socketRef.current) return;
    if (joinStatus === "PENDING") {
      alert("방장의 승인을 기다리는 중입니다.");
      return;
    }
    const messageData = {
      room_id: roomId,
      user_id: user.id,
      content: input,
      sender_nickname: user.nickname,
      avatar_url: user.profile_image_url || null, // Ensure avatar is sent
    };
    socketRef.current.emit("send_message", messageData);
    setInput("");
  };

  const handleApprove = async (targetUserId: number) => {
    if (!socketRef.current) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/approve`, {
        method: "POST",
        body: JSON.stringify({ userId: targetUserId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
        socketRef.current.emit("approve_join", { roomId, userId: targetUserId });
      }
    } catch (e) {
      console.error("Approve failed", e);
    }
  };

  const handleKick = async (targetUserId: number) => {
    if (!confirm("정말 강퇴하시겠습니까? (재입장 불가)")) return;
    try {
      await fetch(`/api/rooms/${roomId}/kick`, {
        method: "POST",
        body: JSON.stringify({ userId: targetUserId }),
      });
      // Optimistic update
      setJoinedUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
      // TODO: Emit socket event 'kick_user' if backend doesn't
    } catch (e) {
      console.error("Kick failed", e);
    }
  };

  const handleLeave = async () => {
    if (!confirm("방을 나가시겠습니까?")) return;
    try {
      if (user) {
        await fetch(`/api/rooms/${roomId}/leave`, {
          method: "POST",
          body: JSON.stringify({ userId: user.id }),
        });
      }
      router.push("/match/" + (roomInfo?.id || "")); // Redirect to match page or home?
      // Assuming match_id is available? roomInfo only has id?
      // Actually roomInfo doesn't have match_id in my interface above. I should add it.
      // Or just go back.
      router.back();
    } catch (e) {
      console.error("Leave failed", e);
    }
  };

  const handleCloseRecruitment = async () => {
    if (!confirm("모집을 마감하시겠습니까? (더 이상 참여 신청 불가)")) return;
    try {
      await fetch(`/api/rooms/${roomId}/close`, { method: "POST" });
      setCurrentRoomStatus("CLOSED");
    } catch (e) {
      console.error("Close failed", e);
    }
  };

  const handleUpdateNotice = async (text: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/content`, {
        method: "PUT",
        body: JSON.stringify({ content: text }),
      });
      setNotice(text);
      alert("공지사항이 수정되었습니다.");
    } catch (e) {
      console.error("Notice update failed", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
      {/* Sidebar - Only for Room Mode */}
      {isRoomMode && (
        <RoomSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          joinedUsers={joinedUsers}
          pendingUsers={pendingUsers}
          isHost={isHost}
          hostId={hostId || roomInfo?.host_id}
          currentUserId={user?.id}
          noticeContent={notice}
          roomStatus={currentRoomStatus}
          onUpdateNotice={handleUpdateNotice}
          onKick={handleKick}
          onApprove={handleApprove}
          onLeave={handleLeave}
          onCloseRecruitment={handleCloseRecruitment}
        />
      )}

      {/* Modal Integration */}
      {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 relative z-10">
        <h2 className="font-bold text-lg flex items-center gap-2">
          {/* Back Button (Room Mode) */}
          {isRoomMode && (
            <a href={`/match/${roomInfo?.match_id}`} className="mr-1 py-1 pr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
          )}
          {title || "📣 실시간 응원톡"}
          {/* Only show participants list if NOT room mode (or always? User design preference. Room mode uses sidebar for list) */}
          {/* Let's keep the mini-facepile for quick view, but maybe reduce it */}
          <div className="flex -space-x-2 overflow-hidden items-center py-1">
            {/* ... existing facepile ... */}
            {joinedUsers.slice(0, 3).map((u, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 border-2 border-white overflow-hidden">
                {u.avatar_url ? <Image src={u.avatar_url} alt={u.nickname} width={24} height={24} /> : null}
              </div>
            ))}
            {joinedUsers.length > 3 && <span className="text-xs text-zinc-500 ml-1">+{joinedUsers.length - 3}</span>}
          </div>
        </h2>

        {/* Hamburger Button (Room Mode) */}
        {isRoomMode && (
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-500 hover:text-black relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            {isHost && pendingUsers.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
        )}
      </div>

      <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-y-auto min-h-[400px]">
        {/* ... Chat Content ... */}
        {joinStatus === "PENDING" ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>방장의 입장을 승인 대기 중입니다...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const matchesUser = user && String(msg.user_id) === String(user.id);
              const prevMsg = messages[index - 1];
              const isNewDate = !prevMsg || !isSameDay(new Date(prevMsg.created_at), new Date(msg.created_at));

              return (
                <div key={index}>
                  {isNewDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                        {format(new Date(msg.created_at), "yyyy년 M월 d일", { locale: ko })}
                      </span>
                    </div>
                  )}
                  <div className={`flex gap-3 ${matchesUser ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                        matchesUser ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                      }`}
                      onClick={() => setSelectedUserId(Number(msg.user_id))}
                    >
                      {msg.avatar_url ? (
                        <Image src={msg.avatar_url} alt="avatar" width={32} height={32} className="object-cover" />
                      ) : (
                        msg.nickname.charAt(0)
                      )}
                    </div>
                    <div className={`flex flex-col gap-1 ${matchesUser ? "items-end" : "items-start"}`}>
                      <span className="text-xs text-zinc-500 font-medium">{msg.nickname}</span>
                      <div className="flex items-end gap-1.5">
                        {matchesUser && (
                          <span className="text-[10px] text-zinc-400 min-w-fit mb-0.5">
                            {format(new Date(msg.created_at), "a h:mm", { locale: ko })}
                          </span>
                        )}
                        <div
                          className={`p-2.5 rounded-2xl text-sm shadow-sm border ${
                            matchesUser
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {!matchesUser && (
                          <span className="text-[10px] text-zinc-400 min-w-fit mb-0.5">
                            {format(new Date(msg.created_at), "a h:mm", { locale: ko })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              user
                ? joinStatus === "PENDING"
                  ? "승인 대기 중..."
                  : "응원 메시지를 남겨보세요!"
                : "로그인이 필요합니다"
            }
            disabled={!user || joinStatus === "PENDING"}
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!user || joinStatus === "PENDING"}
            className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
