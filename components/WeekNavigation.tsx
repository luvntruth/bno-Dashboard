
import React from 'react';
import { WeekSchedule } from '../types';

interface WeekNavigationProps {
  schedule: WeekSchedule[];
  activeWeek: number;
  onWeekChange: (idx: number) => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({ schedule, activeWeek, onWeekChange }) => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
      {schedule.map((week, idx) => (
        <button
          key={idx}
          onClick={() => onWeekChange(idx)}
          className={`flex-shrink-0 px-6 py-4 rounded-2xl font-bold transition-all duration-300 text-left min-w-[160px] border-2 ${
            activeWeek === idx
              ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200 transform -translate-y-1'
              : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-slate-50'
          }`}
        >
          <div className={`text-[10px] uppercase tracking-tighter mb-1 font-black ${activeWeek === idx ? 'text-blue-100' : 'text-slate-400'}`}>
            {week.dateRange}
          </div>
          <div className="text-xl">{week.week}주차</div>
        </button>
      ))}
    </div>
  );
};
