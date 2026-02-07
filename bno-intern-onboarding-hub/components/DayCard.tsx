
import React, { useState } from 'react';
import { Coffee, Sunrise, Sunset, Check, Trash2, Edit3, Plus, Save, X as CloseIcon, User } from 'lucide-react';
import { DaySchedule, TaskItem } from '../types';

interface DayCardProps {
  day: DaySchedule;
  dayIdx: number;
  weekIdx: number;
  completedTasks: Set<string>;
  onToggleTask: (dayIdx: number, session: 'am' | 'pm', taskIdx: number) => void;
  onUpdateTask: (dayIdx: number, session: 'am' | 'pm', taskIdx: number, newValue: string) => void;
  onDeleteTask: (dayIdx: number, session: 'am' | 'pm', taskIdx: number) => void;
  onAddTask: (dayIdx: number, session: 'am' | 'pm') => void;
}

export const DayCard: React.FC<DayCardProps> = ({ 
  day, 
  dayIdx, 
  weekIdx, 
  completedTasks, 
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
  onAddTask
}) => {
  const isHoliday = day.isHoliday;
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (session: 'am' | 'pm', idx: number, currentVal: string) => {
    setEditingKey(`${session}-${idx}`);
    setEditValue(currentVal);
  };

  const saveEdit = (session: 'am' | 'pm', idx: number) => {
    onUpdateTask(dayIdx, session, idx, editValue);
    setEditingKey(null);
  };

  const renderTask = (item: TaskItem, idx: number, session: 'am' | 'pm') => {
    const isCompleted = completedTasks.has(`${weekIdx}-${dayIdx}-${session}-${idx}`);
    const isEditing = editingKey === `${session}-${idx}`;
    
    return (
      <li 
        key={idx} 
        className={`group/task flex flex-col gap-1 p-3 rounded-xl border transition-all duration-200 ${
          isCompleted 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-sm' 
            : isEditing 
              ? 'bg-white border-blue-400 ring-2 ring-blue-50' 
              : 'bg-white border-transparent hover:border-slate-200 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-3 w-full">
          <div 
            onClick={() => !isEditing && onToggleTask(dayIdx, session, idx)}
            className={`w-5 h-5 rounded-md border-2 flex flex-shrink-0 items-center justify-center transition-all cursor-pointer ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-500' 
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
          
          {isEditing ? (
            <div className="flex-grow flex items-center gap-2">
              <input 
                autoFocus
                className="flex-grow text-sm font-semibold bg-transparent border-none outline-none focus:ring-0 text-slate-900"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(session, idx)}
              />
              <button onClick={() => saveEdit(session, idx)} className="text-emerald-600 hover:text-emerald-700 shrink-0">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span 
                onClick={() => onToggleTask(dayIdx, session, idx)}
                className={`flex-grow text-sm font-semibold leading-relaxed transition-all cursor-pointer break-words ${
                  isCompleted ? 'line-through opacity-70' : ''
                }`}
              >
                {item.text}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); startEditing(session, idx, item.text); }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteTask(dayIdx, session, idx); }}
                  className="p-1.5 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Author Label */}
        {!isEditing && item.author && (
          <div className="flex items-center gap-1 ml-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
            <User className="w-2 h-2" />
            <span>by {item.author}</span>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className={`group bg-white rounded-2xl p-6 border-2 transition-all duration-300 ${
      isHoliday 
        ? 'border-rose-100 bg-rose-50/30' 
        : 'border-slate-100 hover:border-blue-100 hover:shadow-lg hover:shadow-slate-200/50'
    }`}>
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="xl:w-32 flex-shrink-0">
          <div className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-black mb-3 ${
            isHoliday ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors'
          }`}>
            {day.day}
          </div>
          {isHoliday && (
            <div className="text-rose-500 text-sm font-bold mt-1 flex items-center gap-1.5 animate-pulse">
              <Coffee className="w-4 h-4" />
              휴무
            </div>
          )}
        </div>

        <div className="flex-grow">
          {isHoliday ? (
            <div className="flex flex-col justify-center h-full">
              <h4 className="text-lg font-bold text-rose-600">{day.holidayName}</h4>
              <p className="text-slate-500 italic mt-1 font-medium">{day.desc}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-10">
              {/* AM Section */}
              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Sunrise className="w-4 h-4 text-amber-500" />
                    </div>
                    <h4 className="text-xs font-black text-amber-600 tracking-widest uppercase">Morning</h4>
                  </div>
                  <button 
                    onClick={() => onAddTask(dayIdx, 'am')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {day.am?.map((item, i) => renderTask(item, i, 'am'))}
                </ul>
              </div>

              {/* PM Section */}
              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Sunset className="w-4 h-4 text-blue-500" />
                    </div>
                    <h4 className="text-xs font-black text-blue-600 tracking-widest uppercase">Afternoon</h4>
                  </div>
                  <button 
                    onClick={() => onAddTask(dayIdx, 'pm')}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <ul className="space-y-2">
                  {day.pm?.map((item, i) => renderTask(item, i, 'pm'))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
