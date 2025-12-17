"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface AuthRequest {
  id: number;
  user_id: number;
  user_nickname: string;
  match_id: number;
  match_title: string;
  match_date: string;
  image_url: string;
  status: string;
  created_at: string;
}

export default function AdminAuthPage() {
  const [list, setList] = useState<AuthRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      const res = await fetch("/api/admin/auths");
      const data = await res.json();
      if (data.success) {
        setList(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      if (!confirm(`${action === "approve" ? "승인" : "거절"} 하시겠습니까?`)) return;

      const res = await fetch(`/api/admin/auths/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        alert("처리되었습니다.");
        fetchList(); // Reload
      } else {
        alert("오류: " + data.error);
      }
    } catch {
      alert("Error");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">📸 직관 인증 요청 관리</h1>

      {loading ? (
        <div>Loading...</div>
      ) : list.length === 0 ? (
        <div className="text-zinc-500">대기 중인 요청이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((item) => (
            <div key={item.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-48 bg-black/5">
                <Image src={item.image_url} alt="ticket" fill className="object-contain" />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg">{item.user_nickname}</span>
                  <span className="text-xs text-zinc-400">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-zinc-600 mb-4">
                  {item.match_title} <br />
                  <span className="text-xs text-zinc-400">{new Date(item.match_date).toLocaleDateString()}</span>
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, "reject")}
                    className="flex-1 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-lg hover:bg-red-100"
                  >
                    거절
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    className="flex-1 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-lg hover:bg-blue-100"
                  >
                    승인
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
