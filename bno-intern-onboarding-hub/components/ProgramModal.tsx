
import React, { useState, useEffect } from 'react';
import { X, ClipboardList, HelpCircle, AlertTriangle, CheckCircle, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { ProgramDetail, ModalTab } from '../types';
import { getProgramFacilitationAdvice } from '../services/gemini';

interface ProgramModalProps {
  programName: string;
  details: ProgramDetail;
  onClose: () => void;
}

export const ProgramModal: React.FC<ProgramModalProps> = ({ programName, details, onClose }) => {
  const [activeTab, setActiveTab] = useState<ModalTab>(ModalTab.CHECK);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  const handleFetchAiAdvice = async () => {
    setIsLoadingAi(true);
    const advice = await getProgramFacilitationAdvice(programName);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  useEffect(() => {
    if (activeTab === ModalTab.AI_TUTOR && !aiAdvice && !isLoadingAi) {
      handleFetchAiAdvice();
    }
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">{programName}</h3>
              <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">{details.description || '전문 교육 프로그램'}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
          {[
            { id: ModalTab.CHECK, label: '체크리스트', icon: CheckCircle },
            { id: ModalTab.FAQ, label: 'FAQ', icon: HelpCircle },
            { id: ModalTab.EMERGENCY, label: '비상대처', icon: AlertTriangle, color: 'text-rose-500' },
            { id: ModalTab.AI_TUTOR, label: 'AI 튜터', icon: Sparkles, color: 'text-indigo-600' },
          ].map((tab) => {
            const Icon = tab.icon as React.ComponentType<any>;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ModalTab)}
                className={`flex-1 py-4 text-[13px] font-black flex flex-col items-center gap-1 transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? `bg-white border-blue-600 ${tab.color || 'text-blue-600'}` 
                    : 'text-slate-400 border-transparent hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-8 overflow-y-auto bg-white min-h-[300px]">
          {activeTab === ModalTab.CHECK && (
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">준비 및 패킹 가이드</h4>
              <ul className="space-y-4">
                {details.checkpoints.map((item, idx) => (
                  <li key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-slate-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === ModalTab.FAQ && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">자주 묻는 질문</h4>
              {details.faq?.length ? (
                details.faq.map((item, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl text-sm ${
                    item.startsWith('Q.') 
                      ? 'font-black text-slate-900 bg-blue-50 border border-blue-100' 
                      : 'font-medium text-slate-600 ml-6 bg-slate-50 border border-slate-100'
                  }`}>
                    {item}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic text-center py-12 font-medium">등록된 FAQ 정보가 없습니다.</div>
              )}
            </div>
          )}

          {activeTab === ModalTab.EMERGENCY && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 리스크 매니지먼트 가이드
              </h4>
              {details.emergency?.length ? (
                details.emergency.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-rose-50 rounded-2xl border border-rose-100">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0 shadow-sm shadow-rose-200" />
                    <span className="text-sm font-bold text-rose-700 leading-relaxed">{item}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 italic text-center py-12 font-medium">등록된 비상 대처 정보가 없습니다.</div>
              )}
            </div>
          )}

          {activeTab === ModalTab.AI_TUTOR && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-indigo-600 p-5 rounded-2xl text-white shadow-lg shadow-indigo-100 mb-6">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black">AI 선배의 노하우 전수</h4>
                  <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-tighter">Powered by Gemini 2.5</p>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl border-2 border-indigo-50 relative">
                {isLoadingAi ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs font-black text-indigo-400 uppercase">AI 선배가 조언을 작성 중입니다...</p>
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-4">
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 shadow-md">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-slate-700 text-sm font-bold leading-loose whitespace-pre-wrap italic">
                        "{aiAdvice}"
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={handleFetchAiAdvice}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <Loader2 className="w-3 h-3" /> 조언 새로고침
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100 shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-black transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-slate-200"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
