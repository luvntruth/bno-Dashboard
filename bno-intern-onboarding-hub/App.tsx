
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { WeekNavigation } from './components/WeekNavigation';
import { DayCard } from './components/DayCard';
import { ProgramModal } from './components/ProgramModal';
import { SCHEDULE_DATA, PROGRAM_DETAILS, ONBOARDING_GOALS } from './constants';
import { 
  BookOpen, CheckCircle, Search, Trophy, MessageSquare, TrendingUp, Send, Trash2, User, Clock
} from 'lucide-react';
import { WeekSchedule, Comment } from './types';

const App: React.FC = () => {
  // 초기값을 빈 문자열로 설정하여 Layout의 placeholder가 나타나게 합니다.
  const [userName, setUserName] = useState<string>('');
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [schedule, setSchedule] = useState<WeekSchedule[]>(SCHEDULE_DATA);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [weeklyComments, setWeeklyComments] = useState<Record<number, Comment[]>>({});
  const localLastUpdated = useRef<number>(0);
  
  const [newComment, setNewComment] = useState('');

  // 데이터 압축/해제 유틸리티 (UTF-8 대응)
  const encodeState = () => {
    const state = {
      schedule,
      completedTasks: Array.from(completedTasks),
      comments: weeklyComments
    };
    const json = JSON.stringify(state);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64;
  };

  const decodeState = (b64: string) => {
    try {
      const json = decodeURIComponent(escape(atob(b64)));
      return JSON.parse(json);
    } catch (e) {
      console.error("Failed to decode state:", e);
      return null;
    }
  };

  // 초기 로드 (URL 파라미터 확인 후 로컬 스토리지 확인)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shareData = urlParams.get('data');
    
    if (shareData) {
      const decoded = decodeState(shareData);
      if (decoded) {
        setSchedule(decoded.schedule);
        setCompletedTasks(new Set(decoded.completedTasks));
        setWeeklyComments(decoded.comments || {});
      }
    } else {
      const savedName = localStorage.getItem('bno_user_name');
      const savedSchedule = localStorage.getItem('bno_onboarding_schedule');
      const savedTasks = localStorage.getItem('bno_completed_tasks');
      const savedComments = localStorage.getItem('bno_weekly_comments');
      
      // 이전 기본값인 '익명인턴'인 경우 빈 값으로 처리하여 새로운 플레이스홀더가 보이게 유도
      if (savedName && savedName !== '익명인턴') setUserName(savedName);
      if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
      if (savedTasks) setCompletedTasks(new Set(JSON.parse(savedTasks)));
      if (savedComments) setWeeklyComments(JSON.parse(savedComments));
    }
  }, []);

  // Fetch shared state from server and subscribe to server-sent events for live updates
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (data && data.lastUpdated && data.lastUpdated > localLastUpdated.current) {
            if (data.schedule) setSchedule(data.schedule);
            if (data.completedTasks) setCompletedTasks(new Set(data.completedTasks));
            if (data.weeklyComments) setWeeklyComments(data.weeklyComments);
            if (data.userName) setUserName(data.userName);
            localLastUpdated.current = data.lastUpdated;
          }
        }
      } catch (e) {
        // ignore, server may be offline
      }

      // subscribe SSE
      try {
        const es = new EventSource('/api/events');
        es.onmessage = (ev) => {
          try {
            const payload = JSON.parse(ev.data);
            if (payload && payload.lastUpdated && payload.lastUpdated > localLastUpdated.current) {
              if (payload.schedule) setSchedule(payload.schedule);
              if (payload.completedTasks) setCompletedTasks(new Set(payload.completedTasks));
              if (payload.weeklyComments) setWeeklyComments(payload.weeklyComments || {});
              if (payload.userName) setUserName(payload.userName || '');
              localLastUpdated.current = payload.lastUpdated;
            }
          } catch (e) {
            // ignore parse errors
          }
        };

        es.onerror = () => {
          es.close();
        };
      } catch (e) {
        // ignore SSE creation errors
      }
    };

    init();
  }, []);

  // 상태 변경 시 로컬 스토리지 저장
  useEffect(() => {
    localStorage.setItem('bno_user_name', userName);
    localStorage.setItem('bno_onboarding_schedule', JSON.stringify(schedule));
    localStorage.setItem('bno_completed_tasks', JSON.stringify(Array.from(completedTasks)));
    localStorage.setItem('bno_weekly_comments', JSON.stringify(weeklyComments));
    // Sync to server so other users receive updates
    const payload = {
      schedule,
      completedTasks: Array.from(completedTasks),
      weeklyComments,
      userName,
      lastUpdated: Date.now()
    };
    localLastUpdated.current = payload.lastUpdated;
    fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => { /* ignore network errors */ });
  }, [userName, schedule, completedTasks, weeklyComments]);

  const activeWeek = schedule[activeWeekIdx];
  const programs = Object.keys(PROGRAM_DETAILS);
  
  const filteredPrograms = useMemo(() => {
    if (!searchQuery) return programs;
    return programs.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, programs]);

  const weekStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    activeWeek.days.forEach((day, dayIdx) => {
      if (day.isHoliday) return;
      (day.am || []).forEach((_, tIdx) => { total++; if (completedTasks.has(`${activeWeekIdx}-${dayIdx}-am-${tIdx}`)) completed++; });
      (day.pm || []).forEach((_, tIdx) => { total++; if (completedTasks.has(`${activeWeekIdx}-${dayIdx}-pm-${tIdx}`)) completed++; });
    });
    return { total, completed, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [activeWeek, activeWeekIdx, completedTasks]);

  const handleShare = async () => {
    try {
      const data = encodeState();
      const url = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(data)}`;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        alert("공유 링크가 클립보드에 복사되었습니다!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert("공유 링크가 복사되었습니다!");
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
      alert("링크 복사에 실패했습니다.");
    }
  };

  const toggleTask = (dayIdx: number, session: 'am' | 'pm', taskIdx: number) => {
    const key = `${activeWeekIdx}-${dayIdx}-${session}-${taskIdx}`;
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const addTask = (dayIdx: number, session: 'am' | 'pm') => {
    setSchedule(prev => {
      const next = [...prev];
      const day = { ...next[activeWeekIdx].days[dayIdx] };
      const list = session === 'am' ? [...(day.am || [])] : [...(day.pm || [])];
      list.push({ text: "새로운 업무", author: userName || "익명" });
      if (session === 'am') day.am = list; else day.pm = list;
      next[activeWeekIdx].days[dayIdx] = day;
      return next;
    });
  };

  const updateTask = (dayIdx: number, session: 'am' | 'pm', taskIdx: number, val: string) => {
    setSchedule(prev => {
      const next = [...prev];
      const day = { ...next[activeWeekIdx].days[dayIdx] };
      const list = session === 'am' ? [...(day.am || [])] : [...(day.pm || [])];
      list[taskIdx] = { ...list[taskIdx], text: val, author: userName || "익명", lastModified: Date.now() };
      if (session === 'am') day.am = list; else day.pm = list;
      next[activeWeekIdx].days[dayIdx] = day;
      return next;
    });
  };

  const deleteTask = (dayIdx: number, session: 'am' | 'pm', taskIdx: number) => {
    setSchedule(prev => {
      const next = [...prev];
      const day = { ...next[activeWeekIdx].days[dayIdx] };
      const list = session === 'am' ? [...(day.am || [])] : [...(day.pm || [])];
      list.splice(taskIdx, 1);
      if (session === 'am') day.am = list; else day.pm = list;
      next[activeWeekIdx].days[dayIdx] = day;
      return next;
    });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      text: newComment,
      author: userName || "익명",
      timestamp: Date.now()
    };
    setWeeklyComments(prev => ({
      ...prev,
      [activeWeekIdx]: [...(prev[activeWeekIdx] || []), comment]
    }));
    setNewComment('');
  };

  const deleteComment = (id: string) => {
    setWeeklyComments(prev => ({
      ...prev,
      [activeWeekIdx]: (prev[activeWeekIdx] || []).filter(c => c.id !== id)
    }));
  };

  return (
    <Layout userName={userName} onUserChange={setUserName} onShare={handleShare}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="sticky top-20 z-30 space-y-4">
            <WeekNavigation schedule={schedule} activeWeek={activeWeekIdx} onWeekChange={setActiveWeekIdx} />
          </div>

          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{activeWeek.title}</h2>
                <p className="text-sm text-slate-400 font-bold uppercase mt-1 tracking-tighter">Day-by-Day Progression</p>
              </div>
              <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-slate-100" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-blue-600 transition-all duration-1000" strokeDasharray={`${weekStats.percentage}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">{weekStats.percentage}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Progress</div>
                  <div className="text-sm font-black text-slate-900">{weekStats.completed} / {weekStats.total} Done</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activeWeek.days.map((day, dIdx) => (
                <DayCard key={dIdx} day={day} dayIdx={dIdx} weekIdx={activeWeekIdx} completedTasks={completedTasks} onToggleTask={toggleTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} onAddTask={addTask} />
              ))}
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{activeWeek.week}주차 논의 및 피드백</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Shared Discussion Thread</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {(weeklyComments[activeWeekIdx] || []).map((c) => (
                  <div key={c.id} className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${c.author === userName ? 'bg-indigo-50/50 border-indigo-100 ml-8' : 'bg-slate-50 border-slate-100 mr-8'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider">{c.author}</span>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-medium">
                          <Clock className="w-2 h-2" />
                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {c.author === userName && userName !== '' && (
                        <button onClick={() => deleteComment(c.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
                {(!weeklyComments[activeWeekIdx] || weeklyComments[activeWeekIdx].length === 0) && (
                  <div className="py-10 text-center text-slate-300 italic text-sm">등록된 의견이 없습니다. 첫 의견을 남겨보세요!</div>
                )}
              </div>

              <div className="flex gap-3">
                <input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  placeholder="메시지 입력..."
                  className="flex-grow p-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                <button 
                  onClick={addComment}
                  className="p-4 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-8">
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
                  <span>{weekStats.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white transition-all duration-1000" style={{ width: `${weekStats.percentage}%` }} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-sm p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-lg"><BookOpen className="w-5 h-5 text-indigo-600" /></div>
              <div>
                <h3 className="text-lg font-black text-slate-900">프로그램 도서관</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">18 Core Curriculums</p>
              </div>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="검색..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
            </div>
            <div className="flex flex-wrap gap-2.5 max-h-[350px] overflow-y-auto scrollbar-hide pr-1">
              {filteredPrograms.map((prog, idx) => (
                <button key={idx} onClick={() => setSelectedProgramName(prog)} className="px-4 py-2.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all border-b-4 border-slate-200">
                  {prog}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {selectedProgramName && <ProgramModal programName={selectedProgramName} details={PROGRAM_DETAILS[selectedProgramName]} onClose={() => setSelectedProgramName(null)} />}
    </Layout>
  );
};

export default App;
