import React, { useState, useMemo } from 'react';
import { WeekNavigation } from './components/WeekNavigation';
import { DayCard } from './components/DayCard';
import { ProgramModal } from './components/ProgramModal';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CommentSection } from './components/CommentSection';
import { useSchedule } from './hooks/useSchedule';
import { PROGRAM_DETAILS } from './constants';

const App: React.FC = () => {
  const {
    activeWeekIdx, setActiveWeekIdx,
    userName, setUserName,
    schedule,
    completedTasks,
    weeklyComments,
    encodeState,
    actions
  } = useSchedule();

  const [selectedProgramName, setSelectedProgramName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const activeWeek = schedule[activeWeekIdx];
  const comments = weeklyComments[activeWeekIdx] || [];

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

  return (
    <Header userName={userName} onUserChange={setUserName} onShare={handleShare}>
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
                <DayCard
                  key={dIdx}
                  day={day}
                  dayIdx={dIdx}
                  weekIdx={activeWeekIdx}
                  completedTasks={completedTasks}
                  onToggleTask={actions.toggleTask}
                  onUpdateTask={actions.updateTask}
                  onDeleteTask={actions.deleteTask}
                  onAddTask={actions.addTask}
                />
              ))}
            </div>

            <CommentSection
              weekTitle={activeWeek.week.toString()}
              comments={comments}
              userName={userName}
              onAddComment={actions.addComment}
              onDeleteComment={actions.deleteComment}
            />
          </div>
        </div>

        <Sidebar
          completedRate={weekStats.percentage}
          completedCount={weekStats.completed}
          totalCount={weekStats.total}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectProgram={setSelectedProgramName}
        />
      </div>

      {selectedProgramName && (
        <ProgramModal
          programName={selectedProgramName}
          details={PROGRAM_DETAILS[selectedProgramName]}
          onClose={() => setSelectedProgramName(null)}
        />
      )}
    </Header>
  );
};

export default App;
