
import React from 'react';
import { Star, Calendar, Users, User, Share2 } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  userName: string;
  onUserChange: (name: string) => void;
  onShare: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, userName, onUserChange, onShare }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 px-4 md:px-8 pt-4">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-slate-900 rounded-xl">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-grow md:flex-grow-0">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Contributor Name</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => onUserChange(e.target.value)}
                placeholder="자신의 이름을 기재해주세요"
                className="bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 placeholder:text-slate-300 w-full"
              />
            </div>
          </div>
          
          <button 
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-indigo-100"
          >
            <Share2 className="w-3.5 h-3.5" />
            공유 링크 생성
          </button>
        </div>

        <header className="bg-white rounded-3xl shadow-sm p-6 md:p-10 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold mb-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Star className="w-5 h-5 text-white fill-current" />
                </div>
                <span className="tracking-widest text-xs uppercase font-extrabold">2026 BnO Internship Portal</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">인턴 4주 온보딩 플랜</h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm font-medium">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>2026.02.02 - 02.27</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>실시간 공유 허브</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
};
