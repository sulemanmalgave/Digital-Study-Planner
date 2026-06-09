import React, { useState, useEffect, useRef } from 'react';
import { Subject, FocusLog } from '../types';
import { 
  Clock, Play, Pause, RotateCcw
} from 'lucide-react';

interface FocusViewProps {
  subjects: Subject[];
  focusLogs: FocusLog[];
  profile: any;
  onAddFocusSession: (durationMinutes: number, subjectId?: string) => void;
}

type TimerMode = 'pomodoro' | 'short' | 'long' | 'custom';

export default function FocusView({
  subjects,
  focusLogs,
  profile,
  onAddFocusSession,
}: FocusViewProps) {
  const DURATIONS: Record<Exclude<TimerMode, 'custom'>, number> = {
    pomodoro: 25,
    short: 5,
    long: 15,
  };

  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [customMinutes, setCustomMinutes] = useState(40);

  const getInitialSeconds = (targetMode: TimerMode): number => {
    if (targetMode === 'custom') {
      return customMinutes * 60;
    }
    return DURATIONS[targetMode] * 60;
  };

  const [secondsLeft, setSecondsLeft] = useState(getInitialSeconds('pomodoro'));
  const [isActive, setIsActive] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    resetTimer(mode);
  }, [mode, customMinutes]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const currentDurationMinutes = mode === 'custom' ? customMinutes : DURATIONS[mode === 'short' || mode === 'long' ? 'short' : 'pomodoro'];
    
    if (mode === 'pomodoro' || mode === 'custom') {
      onAddFocusSession(currentDurationMinutes, selectedSubjectId || undefined);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = (newMode: TimerMode = mode) => {
    setIsActive(false);
    setSecondsLeft(getInitialSeconds(newMode));
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const focusMinutesToday = focusLogs
    .filter(log => log.dateTime === todayStr)
    .reduce((sum, log) => sum + log.durationMinutes, 0);

  return (
    <div className="space-y-6 max-w-sm mx-auto pt-6 text-center" id="focus_tab">
      
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Focus</h1>
        <div className="inline-block mt-2 px-3 py-1 bg-slate-900 rounded-full text-xs font-semibold text-indigo-400 border border-slate-800">
          {focusMinutesToday}m today
        </div>
      </div>

      <div className="text-6xl font-extrabold text-white tabular-nums py-8">
        {formatTime(secondsLeft)}
      </div>

      <div className="grid grid-cols-2 gap-3 pb-4">
        {[15, 25, 45, 60].map(mins => (
          <button 
            key={mins}
            onClick={() => {
              setMode('custom');
              setCustomMinutes(mins);
            }}
            className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-semibold text-slate-300 hover:border-indigo-500 transition"
          >
            {mins}m
          </button>
        ))}
      </div>

      <button
        onClick={toggleTimer}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-2"
      >
        {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        {isActive ? 'Pause' : 'Start Focus'}
      </button>

      {isActive && (
        <button
          onClick={() => resetTimer()}
          className="w-full py-2 text-slate-500 hover:text-white font-semibold flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      )}
    </div>
  );
}
