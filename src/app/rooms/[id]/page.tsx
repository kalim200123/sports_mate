export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // params is a Promise in recent Next.js versions (though type says { id: string } in current file, better to handle async if needed, but keeping simple for now based on file content)
  // Actually the file content shows type { params: { id: string } }, so it's treated as object.
  // Wait, Next.js 15 params are async. The previous file content showed synchronous access.
  // Let's stick to the existing signature for now to avoid larger refactor, just fix the lint.
  const { id } = await params;
  const roomId = id;
  console.log("Room ID:", roomId);

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <a href="/match/1" className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
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
          <div>
            <h1 className="font-bold text-lg">E구역 100블럭 직관하실 분!</h1>
            <p className="text-xs text-zinc-500">4명 중 1명 참여중</p>
          </div>
        </div>
        <button className="text-zinc-400 hover:text-zinc-600">
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
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center my-4">
          <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full">
            2025년 12월 16일
          </span>
        </div>
        <div className="flex justify-center my-4">
          <span className="text-xs text-zinc-400">방장이 입장했습니다.</span>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-2">
          <button className="p-3 text-zinc-400 hover:text-blue-600 transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <input
            type="text"
            placeholder="메시지 입력..."
            className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
