"use client";

import { useUserStore } from "@/store/use-user-store";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: number;
  user_id: number;
  content: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
}

interface CheeringChatProps {
  roomId: string;
  hostId?: number;
  initialJoinedUsers?: { nickname: string; avatar_url: string }[];
}

export default function CheeringChat({ roomId, hostId, initialJoinedUsers }: CheeringChatProps) {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [joinedUsers, setJoinedUsers] = useState<{ nickname: string; avatar_url: string }[]>(initialJoinedUsers || []);
  const [joinStatus, setJoinStatus] = useState<"PENDING" | "JOINED" | null>(null);
  const [pendingUsers, setPendingUsers] = useState<{ userId: number; nickname: string; avatar_url: string }[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isHost = user?.id === hostId;

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

    // 1. Connect to Socket Server
    socketRef.current = io("http://localhost:4000");

    // 2. Join Room
    socketRef.current.emit("join_room", { roomId, userId: user?.id });

    // 3. Listen for Messages & Updates
    socketRef.current.on("receive_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Removed room_update listener for count as it's not used here anymore.
    // Logic for count updates should be handled by parent or separate component if needed.

    socketRef.current.on(
      "join_request",
      (data: { userId: number; nickname: string; avatar_url: string; status: string }) => {
        // If current user is the one joining, set status (though usually initial join creates PENDING)
        if (user && data.userId === user.id) {
          setJoinStatus("PENDING");
        }
        // If I am the host, show pending request
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

      // Optimistically add to joined users list if data provided
      if (data.nickname) {
        setJoinedUsers((prev) => [...prev, { nickname: data.nickname!, avatar_url: data.avatar_url || "" }]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [roomId, user, isHost]);

  // Auto-scroll to bottom
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
    };

    socketRef.current.emit("send_message", messageData);
    setInput("");
  };

  const handleApprove = async (targetUserId: number) => {
    if (!socketRef.current) return;

    // Call API or emit socket event directly (Using API as per plan to be safe/secure/auth check)
    try {
      const res = await fetch(`/api/rooms/${roomId}/approve`, {
        method: "POST",
        body: JSON.stringify({ userId: targetUserId }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        // Socket server will broadcast the update, but we can optimistically remove from UI
        setPendingUsers((prev) => prev.filter((u) => u.userId !== targetUserId));
        socketRef.current.emit("approve_join", { roomId, userId: targetUserId }); // Redundant but ensures socket event if API doesn't emit
      }
    } catch (e) {
      console.error("Approve failed", e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2 overflow-hidden">
          {/* Nicknames display */}
          <div className="flex -space-x-2 overflow-hidden items-center py-1">
            <span className="text-sm font-semibold mr-2 text-zinc-600 dark:text-zinc-400 shrink-0">참여자:</span>
            {joinedUsers.slice(0, 5).map((u, i) => (
              <div
                key={i}
                className="relative group shrink-0 w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 overflow-hidden bg-zinc-200"
              >
                {u.avatar_url ? (
                  <Image src={u.avatar_url} alt={u.nickname} width={32} height={32} className="object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-xs">{u.nickname.charAt(0)}</span>
                )}
              </div>
            ))}
            {joinedUsers.length > 5 && (
              <span className="flex items-center justify-center w-8 h-8 text-xs font-medium bg-zinc-200 dark:bg-zinc-700 rounded-full border-2 border-white dark:border-zinc-900 shrink-0">
                +{joinedUsers.length - 5}
              </span>
            )}
          </div>
        </h2>
        {/* Pending Requests UI - Restricted to Host */}
        {isHost && pendingUsers.length > 0 && (
          <div className="absolute top-16 right-4 z-50 bg-white shadow-lg border p-3 rounded-lg w-64">
            <h3 className="text-sm font-bold mb-2">입장 대기 중 ({pendingUsers.length})</h3>
            <ul className="space-y-2">
              {pendingUsers.map((req) => (
                <li key={req.userId} className="flex justify-between items-center text-sm">
                  <span>{req.nickname}</span>
                  <button
                    onClick={() => handleApprove(req.userId)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                  >
                    승인
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-y-auto min-h-[400px]">
        {joinStatus === "PENDING" ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>방장의 입장을 승인 대기 중입니다...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isMe = user ? msg.user_id === user.id : false;
              return (
                <div key={index} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden ${
                      isMe ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {msg.avatar_url ? (
                      <Image src={msg.avatar_url} alt="avatar" width={32} height={32} className="object-cover" />
                    ) : (
                      msg.nickname.charAt(0)
                    )}
                  </div>
                  <div className={`flex flex-col gap-1 ${isMe ? "items-end" : ""}`}>
                    <span className="text-xs text-zinc-500 font-medium">{msg.nickname}</span>
                    <div
                      className={`p-2.5 rounded-2xl text-sm shadow-sm border ${
                        isMe
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

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
