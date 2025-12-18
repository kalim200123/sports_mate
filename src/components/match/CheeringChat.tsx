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
  type?: "TEXT" | "SYSTEM";
}

interface RoomInfo {
  id: number;
  host_id: number;
  title: string;
  content: string;
  status: string;
  max_count: number;
  current_count: number;
  match_id: number;
  region?: string;
  notice?: string;
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

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [joinedUsers, setJoinedUsers] = useState<{ userId?: number; nickname: string; avatar_url: string }[]>(
    initialJoinedUsers || []
  );
  const [joinStatus, setJoinStatus] = useState<"PENDING" | "JOINED" | null>(null);
  const [pendingUsers, setPendingUsers] = useState<{ userId: number; nickname: string; avatar_url: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Membership & Gate State
  const [membershipStatus, setMembershipStatus] = useState<"NONE" | "PENDING" | "JOINED" | "LOADING" | "KICKED">(
    "LOADING"
  );
  const [entryInfo, setEntryInfo] = useState<{
    roomStatus: string;
    currentCount: number;
    maxCount: number;
    userStatus: string | null;
    matchInfo: { homeTeam: string; awayTeam: string; matchDate: string; location: string };
  } | null>(null);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(roomInfo?.notice || "");
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [isEditingNotice, setIsEditingNotice] = useState(false);
  const [currentRoomStatus, setCurrentRoomStatus] = useState(roomInfo?.status || "OPEN");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHost = user?.id === (hostId || roomInfo?.host_id);
  const isRoomMode = !!roomInfo; // If roomInfo is passed, we are in Room Mode

  // 0. Check Membership on Mount
  useEffect(() => {
    const checkMembership = async () => {
      if (!user) {
        setMembershipStatus("NONE");
        return;
      }
      try {
        const res = await fetch(`/api/rooms/${roomId}/membership?userId=${user.id}`);
        const data = await res.json();
        if (data.success) {
          setEntryInfo(data.data);
          const status = data.data.userStatus;
          if (status === "JOINED" || status === "PENDING" || isHost) {
            setMembershipStatus(status === "PENDING" ? "PENDING" : "JOINED");
          } else {
            setMembershipStatus("NONE");
          }
        }
      } catch (err) {
        console.error("Check membership failed", err);
        setMembershipStatus("NONE");
      }
    };
    checkMembership();
  }, [roomId, user, isHost]);

  // 0.5 Fetch Pending Users (Host Only)
  useEffect(() => {
    if (isHost && membershipStatus === "JOINED") {
      fetch(`/api/rooms/${roomId}/pending`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPendingUsers(data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch pending users", err));
    }
  }, [roomId, isHost, membershipStatus]);

  // 1. Socket Connection (Only if Membership is PENDING or JOINED)
  useEffect(() => {
    if (membershipStatus === "LOADING" || membershipStatus === "NONE" || membershipStatus === "KICKED") return;

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
    if (user && membershipStatus === "JOINED") {
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
          setMembershipStatus("PENDING");
        }
        if (isHost) {
          setPendingUsers((prev) => [...prev, data]);
        }
      }
    );

    socketRef.current.on("join_approved", (data: { userId: number; nickname?: string; avatar_url?: string }) => {
      if (user && data.userId === user.id) {
        setJoinStatus("JOINED");
        setMembershipStatus("JOINED");
      }
      setPendingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      if (data.nickname) {
        setJoinedUsers((prev) => [
          ...prev,
          { userId: data.userId, nickname: data.nickname!, avatar_url: data.avatar_url || "" },
        ]);
      }
    });

    socketRef.current.on("join_error", (data: { message: string }) => {
      alert(data.message);
      setMembershipStatus("NONE");
      setJoinStatus(null);
    });

    socketRef.current.on("user_kicked", (data: { userId: number; nickname?: string }) => {
      // If I am the kicked user
      if (user && data.userId === user.id) {
        setMembershipStatus("KICKED");
        setJoinStatus(null);
      }
      // Remove from list for others
      setJoinedUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, user, isHost, membershipStatus]);

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

      const data = await res.json();

      if (res.ok && data.success) {
        setPendingUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
        socketRef.current.emit("approve_join", { roomId, userId: targetUserId });
      } else {
        if (data.error === "ROOM_FULL") {
          alert("방 정원이 초과되어 더 이상 승인할 수 없습니다.");
        } else {
          alert("승인 처리에 실패했습니다.");
        }
      }
    } catch (e) {
      console.error("Approve failed", e);
      alert("오류가 발생했습니다.");
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

      // Emit socket event 'kick_user' to notify server & user
      if (socketRef.current) {
        // Find nickname for better log/UX if needed
        const targetUser = joinedUsers.find((u) => u.userId === targetUserId);
        socketRef.current.emit("kick_user", { roomId, userId: targetUserId, nickname: targetUser?.nickname });
      }
    } catch (e) {
      console.error("Kick failed", e);
    }
  };

  const handleLeave = async () => {
    if (isHost) {
      if (!confirm("방장이 나가면 방이 삭제됩니다. 정말 삭제하고 나가시겠습니까?")) return;
      try {
        await fetch(`/api/rooms/${roomId}/delete`, {
          method: "POST",
          body: JSON.stringify({ userId: user?.id }),
        });
        router.push("/match/" + (roomInfo?.match_id || ""));
      } catch (e) {
        console.error("Delete failed", e);
      }
    } else {
      if (!confirm("방을 나가시겠습니까?")) return;
      try {
        if (user) {
          await fetch(`/api/rooms/${roomId}/leave`, {
            method: "POST",
            body: JSON.stringify({ userId: user.id }),
          });

          if (socketRef.current) {
            socketRef.current.emit("leave_room", { roomId, userId: user.id, nickname: user.nickname });
          }
        }
        router.push("/match/" + (roomInfo?.match_id || ""));
      } catch (e) {
        console.error("Leave failed", e);
      }
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
      await fetch(`/api/rooms/${roomId}/notice`, {
        method: "PUT",
        body: JSON.stringify({ notice: text }),
      });
      setNotice(text);
      setIsEditingNotice(false);
      // alert("공지사항이 수정되었습니다.");
    } catch (e) {
      console.error("Notice update failed", e);
    }
  };

  const handleApplyJoin = () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    // We don't need a separate fetch here because socket.emit("join_room") triggers the DB insert in socket-server
    // BUT we added a Gate.
    // If we rely on socket-server to insert "PENDING", we just need to set status to PENDING here to trigger socket effect?
    // Wait, the socket effect depends on membershipStatus.
    // So we should manually trigger the socket connection by setting membershipStatus to 'PENDING' (temporary optimistic)
    // OR we change socket logic to only insert if record doesn't exist.
    // Let's set it to some state that allows connection, and let socket server handle the INSERT.
    // If I set membershipStatus to "PENDING" -> Socket connects -> Emits join_room -> Server inserts PENDING -> Server emits join_request -> Client handles it.
    // Yes.
    setMembershipStatus("PENDING");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      sendMessage();
    }
  };

  if (membershipStatus === "LOADING") {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        Loading...
      </div>
    );
  }

  // Room Entry Gate
  if (membershipStatus === "NONE" && entryInfo) {
    const isFull = entryInfo.currentCount >= entryInfo.maxCount;
    // Format Date: "12월 25일 (토) 14:00"
    const dateStr = format(new Date(entryInfo.matchInfo.matchDate), "M월 d일 (eee) HH:mm", { locale: ko });

    return (
      <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              {entryInfo.matchInfo.location}
            </span>
            <h2 className="text-2xl font-bold dark:text-white">
              {entryInfo.matchInfo.homeTeam} vs {entryInfo.matchInfo.awayTeam}
            </h2>
            <p className="text-zinc-500 font-medium">{dateStr}</p>
          </div>

          <div className="w-full max-w-sm bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl text-left">
            <h3 className="text-sm font-bold text-zinc-500 mb-2">📝 방 소개</h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
              {roomInfo?.content || "등록된 소개글이 없습니다."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-sm text-zinc-500">
              현재 인원 <span className="font-bold text-zinc-900 dark:text-zinc-100">{entryInfo.currentCount}명</span> /{" "}
              {entryInfo.maxCount}명
            </div>

            {isFull ? (
              <button
                onClick={() => {
                  if (confirm("정원이 초과되었습니다. 대기자로 신청하시겠습니까?")) {
                    handleApplyJoin();
                  }
                }}
                className="w-full max-w-xs py-3.5 bg-zinc-800 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                대기 신청하기
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm("이 방에 참여 신청하시겠습니까?")) {
                    handleApplyJoin();
                  }
                }}
                className="w-full max-w-xs py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                참여 신청하기
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiting Screen (PENDING)
  if (membershipStatus === "PENDING") {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-2">
            <svg
              className="w-8 h-8 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold dark:text-white">참여 승인 대기 중</h2>
          <p className="text-zinc-500 max-w-xs">
            방장의 승인을 기다리고 있습니다.
            <br />
            승인이 완료되면 자동으로 입장됩니다.
          </p>
        </div>
      </div>
    );
  }

  // Kicked Screen
  if (membershipStatus === "KICKED") {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">강퇴된 사용자입니다</h2>
          <p className="text-zinc-500 max-w-xs">
            방장에 의해 강퇴되어
            <br />더 이상 이 방에 참여할 수 없습니다.
          </p>
          <button
            onClick={() => router.push(`/match/${roomInfo?.match_id || ""}`)}
            className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            목록으로 나가기
          </button>
        </div>
      </div>
    );
  }

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
          content={roomInfo?.content || ""}
          roomStatus={currentRoomStatus}
          onKick={handleKick}
          onApprove={handleApprove}
          onLeave={handleLeave} // Logic updated in handleLeave
          onCloseRecruitment={handleCloseRecruitment}
        />
      )}

      {/* Modal Integration */}
      {selectedUserId && <UserModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}

      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 relative z-20">
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
          <div className="flex flex-col">
            <span className="flex items-center gap-2">{title || "📣 실시간 응원톡"}</span>
          </div>
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

        {/* Notice Toggle & Hamburger */}
        <div className="flex items-center gap-1">
          {/* Notice Toggle Button */}
          <button
            onClick={() => setIsNoticeOpen(!isNoticeOpen)}
            className={`p-2 rounded-full transition-colors relative ${
              isNoticeOpen ? "bg-blue-50 text-blue-600" : "text-zinc-500 hover:bg-zinc-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12.75 2.25v2.25m0 15v2.25M21.75 12h-2.25m-15 0H2.25"
              />
            </svg>
            {notice && !isNoticeOpen && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

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
      </div>

      {/* Notice Dropdown */}
      <div
        className={`bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden ${
          isNoticeOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2">📢 공지사항</h3>
            {isHost && (
              <button
                onClick={() => (isEditingNotice ? handleUpdateNotice(notice) : setIsEditingNotice(true))}
                className="text-xs text-blue-600 font-medium px-2 py-1 hover:bg-blue-50 rounded"
              >
                {isEditingNotice ? "저장" : "수정"}
              </button>
            )}
          </div>

          {isEditingNotice ? (
            <textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value)}
              className="w-full p-2 text-sm border rounded-lg bg-white dark:bg-zinc-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="공지사항을 입력하세요..."
            />
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {notice || "등록된 공지사항이 없습니다."}
            </p>
          )}
        </div>
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

                  {msg.type === "SYSTEM" ? (
                    <div className="flex justify-center my-2">
                      <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-3 py-1 rounded-full">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex gap-3 ${matchesUser ? "flex-row-reverse" : ""}`}>
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${
                          matchesUser ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        }`}
                        onClick={() => setSelectedUserId(Number(msg.user_id))}
                      >
                        {msg.avatar_url ? (
                          <Image src={msg.avatar_url!} alt="avatar" width={32} height={32} className="object-cover" />
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
                  )}
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
