import React, { useState } from 'react';
import { MessageSquare, User, Clock, Trash2, Send } from 'lucide-react';
import { Comment } from '../types';

interface CommentSectionProps {
    weekTitle: string;
    comments: Comment[];
    userName: string;
    onAddComment: (text: string) => void;
    onDeleteComment: (id: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
    weekTitle, comments, userName, onAddComment, onDeleteComment
}) => {
    const [newComment, setNewComment] = useState('');

    const handleSend = () => {
        if (!newComment.trim()) return;
        onAddComment(newComment);
        setNewComment('');
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{weekTitle}주차 논의 및 피드백</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Shared Discussion Thread</p>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {comments.map((c) => (
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
                                <button onClick={() => onDeleteComment(c.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed">{c.text}</p>
                    </div>
                ))}
                {comments.length === 0 && (
                    <div className="py-10 text-center text-slate-300 italic text-sm">등록된 의견이 없습니다. 첫 의견을 남겨보세요!</div>
                )}
            </div>

            <div className="flex gap-3">
                <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="메시지 입력..."
                    className="flex-grow p-4 bg-slate-50 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
                <button
                    onClick={handleSend}
                    className="p-4 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-lg transition-all"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
