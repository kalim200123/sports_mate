"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  matchId: number;
}

export default function MatchAuthActions({ matchId }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [authStatus, setAuthStatus] = useState<"PENDING" | "APPROVED" | "REJECTED" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/auth`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAuthStatus(data.data.status);
        }
      });
  }, [matchId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return alert("사진을 선택해주세요.");
    setUploading(true);

    try {
      // 1. Upload Image
      const formData = new FormData();
      formData.append("file", selectedFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);

      // 2. Submit Auth Request
      const authRes = await fetch(`/api/matches/${matchId}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });
      const authData = await authRes.json();

      if (authData.success) {
        alert("직관 인증 요청이 완료되었습니다.\n관리자 승인 후 반영됩니다.");
        setIsModalOpen(false);
        setAuthStatus("PENDING"); // Update status immediately
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        alert("오류가 발생했습니다: " + authData.error);
      }
    } catch (e) {
      console.error(e);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const renderAuthButton = () => {
    if (authStatus === "APPROVED") {
      return (
        <button
          disabled
          className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-bold opacity-70 cursor-not-allowed flex items-center gap-1"
        >
          <span>✅</span>
          <span className="hidden md:inline">인증완료</span>
        </button>
      );
    }

    if (authStatus === "PENDING") {
      return (
        <button
          disabled
          className="px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg text-sm font-bold opacity-70 cursor-not-allowed flex items-center gap-1"
        >
          <span>⏳</span>
          <span className="hidden md:inline">심사중</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-bold hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center gap-1"
      >
        <span>📷</span>
        <span className="hidden md:inline">{authStatus === "REJECTED" ? "재인증" : "직관인증"}</span>
      </button>
    );
  };

  return (
    <div className="flex gap-2">
      {renderAuthButton()}

      <button
        onClick={() => router.push(`/match/${matchId}`)}
        className="px-4 py-1.5 bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold hover:bg-blue-100 dark:hover:bg-zinc-700 transition-colors"
      >
        상세보기
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-center">🏟️ 직관 티켓 인증</h3>
            <p className="text-sm text-zinc-500 text-center mb-4">
              경기 티켓이나 직관 인증샷을 올려주세요.
              <br />
              관리자 승인 시 <b>직관 횟수</b>와 <b>승률</b>에 반영됩니다!
            </p>

            <div
              className={`w-full aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4 flex items-center justify-center cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 transition-colors overflow-hidden relative`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <Image src={previewUrl} alt="preview" fill className="object-cover" />
              ) : (
                <div className="text-center text-zinc-400">
                  <span className="text-2xl block mb-1">📸</span>
                  <span className="text-xs">터치하여 사진 업로드</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />

            <div className="flex gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "업로드 중..." : "인증 요청"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
