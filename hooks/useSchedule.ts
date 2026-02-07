import { useState, useEffect, useRef, useCallback } from 'react';
import { WeekSchedule, Comment } from '../types';
import { SCHEDULE_DATA } from '../constants';

export const useSchedule = () => {
    const [activeWeekIdx, setActiveWeekIdx] = useState(0);
    const [userName, setUserName] = useState<string>('');
    const [schedule, setSchedule] = useState<WeekSchedule[]>(SCHEDULE_DATA);
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
    const [weeklyComments, setWeeklyComments] = useState<Record<number, Comment[]>>({});
    const localLastUpdated = useRef<number>(0);

    // Data compression/decompression for sharing
    const encodeState = useCallback(() => {
        const state = {
            schedule,
            completedTasks: Array.from(completedTasks),
            comments: weeklyComments
        };
        return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    }, [schedule, completedTasks, weeklyComments]);

    const decodeState = (b64: string) => {
        try {
            return JSON.parse(decodeURIComponent(escape(atob(b64))));
        } catch (e) {
            console.error("Failed to decode state:", e);
            return null;
        }
    };

    // Initial load
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

            if (savedName && savedName !== '익명인턴') setUserName(savedName);
            if (savedSchedule) setSchedule(JSON.parse(savedSchedule));
            if (savedTasks) setCompletedTasks(new Set(JSON.parse(savedTasks)));
            if (savedComments) setWeeklyComments(JSON.parse(savedComments));
        }
    }, []);

    // Server synchronization & SSE
    useEffect(() => {
        const fetchState = async () => {
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
                // ignore offline
            }
        };

        fetchState();

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
            } catch (e) { /* ignore */ }
        };

        return () => es.close();
    }, []);

    // Sync to local storage and server on change
    useEffect(() => {
        localStorage.setItem('bno_user_name', userName);
        localStorage.setItem('bno_onboarding_schedule', JSON.stringify(schedule));
        localStorage.setItem('bno_completed_tasks', JSON.stringify(Array.from(completedTasks)));
        localStorage.setItem('bno_weekly_comments', JSON.stringify(weeklyComments));

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
        }).catch(() => { /* ignore */ });
    }, [userName, schedule, completedTasks, weeklyComments]);

    // Actions
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

    const addComment = (text: string) => {
        const comment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            text,
            author: userName || "익명",
            timestamp: Date.now()
        };
        setWeeklyComments(prev => ({
            ...prev,
            [activeWeekIdx]: [...(prev[activeWeekIdx] || []), comment]
        }));
    };

    const deleteComment = (id: string) => {
        setWeeklyComments(prev => ({
            ...prev,
            [activeWeekIdx]: (prev[activeWeekIdx] || []).filter(c => c.id !== id)
        }));
    };

    return {
        activeWeekIdx, setActiveWeekIdx,
        userName, setUserName,
        schedule,
        completedTasks,
        weeklyComments,
        encodeState,
        actions: {
            toggleTask,
            addTask,
            updateTask,
            deleteTask,
            addComment,
            deleteComment
        }
    };
};
