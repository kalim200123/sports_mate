"use client";

export default function CheeringChat() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
       <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          실시간 응원톡 🔥 <span className="text-xs font-normal text-zinc-500 bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-full">1,234명 참여중</span>
        </h2>
      </div>

      <div className="flex-1 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 overflow-y-auto min-h-[400px]">
        <div className="space-y-4">
           {/* Mock Messages */}
           <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
              팬
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 font-medium">배구사랑</span>
              <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-2xl rounded-tl-none text-sm shadow-sm border border-zinc-100 dark:border-zinc-700">
                오늘 경기 진짜 재밌겠다 ㅋㅋㅋ
              </div>
            </div>
           </div>

           <div className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600 shrink-0">
              나
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-xs text-zinc-500 font-medium">V리그팬</span>
              <div className="bg-blue-600 text-white p-2.5 rounded-2xl rounded-tr-none text-sm shadow-md">
                직관 가는 사람?? 🙌
              </div>
            </div>
           </div>
        </div>
      </div>

      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="응원 메시지를 남겨보세요!" 
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
