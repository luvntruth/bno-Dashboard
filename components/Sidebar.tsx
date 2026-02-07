import React, { useMemo } from 'react';
import { ONBOARDING_GOALS, PROGRAM_DETAILS } from '../constants';
import { Trophy, TrendingUp, BookOpen, Search } from 'lucide-react';

interface SidebarProps {
    completedRate: number;
    completedCount: number;
    totalCount: number;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    onSelectProgram: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    completedRate, completedCount, totalCount, searchQuery, setSearchQuery, onSelectProgram
}) => {
    const programs = Object.keys(PROGRAM_DETAILS);

    const filteredPrograms = useMemo(() => {
        if (!searchQuery) return programs;
        return programs.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, programs]);

    return (
        <aside className="lg:col-span-4 space-y-8">
            {/* Onboarding Goals */}
            <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight">온보딩 최종 목표</h3>
                    </div>
                    <ul className="space-y-4">
                        {ONBOARDING_GOALS.map((goal, idx) => (
                            <li key={idx} className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/10">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black">{idx + 1}</span>
                                <span className="text-sm font-bold leading-relaxed">{goal}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Weekly Progress */}
            <section className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight">주간 성과</h3>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase text-blue-100">
                            <span>Task Completion</span>
                            <span>{completedRate}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${completedRate}%` }} />
                        </div>
                        <div className="text-right text-xs text-blue-100 mt-1">
                            {completedCount} / {totalCount} 완료
                        </div>
                    </div>
                </div>
            </section>

            {/* Program Library */}
            <section className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-50 rounded-lg"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">프로그램 도서관</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{programs.length} Core Curriculums</p>
                    </div>
                </div>
                <div className="relative mb-6">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                </div>
                <div className="flex flex-wrap gap-2.5 max-h-[350px] overflow-y-auto scrollbar-hide pr-1">
                    {filteredPrograms.map((prog, idx) => (
                        <button key={idx} onClick={() => onSelectProgram(prog)} className="px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border-b-4 border-slate-200">
                            {prog}
                        </button>
                    ))}
                </div>
            </section>
        </aside>
    );
};
