import React, { useState, useEffect, useRef } from 'react';
import { Subject, FocusLog } from '../types';
import { 
  Clock, Play, Pause, RotateCcw, Award, Flame, AlertCircle, 
  ChevronRight, Calendar, Sparkles, BookOpen, Settings
} from 'lucide-react';
import { motion } from 'motion/react';

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
  const [sessionNotes, setSessionNotes] = useState('');

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
    
    const currentDurationMinutes = mode === 'custom' 
      ? customMinutes 
      : DURATIONS[mode === 'short' || mode === 'long' ? 'short' : 'pomodoro'];
    
    onAddFocusSession(currentDurationMinutes, selectedSubjectId || undefined, sessionNotes);
    setSessionNotes(''); // Reset notes
    
    // Play generic sound or alerts using Audio API simply (safe client helper)
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, context.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + 1.2);
    } catch (e) {
      console.warn("Audio Context alert not supported by iframe constraints", e);
    }
    
    alert(`Well done! Focus Session resolved: ${currentDurationMinutes} minutes study logged.`);
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

  // Stats Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const focusMinutesToday = focusLogs
    .filter(log => log.dateTime === todayStr)
    .reduce((sum, log) => sum + log.durationMinutes, 0);

  const totalFocusMinutes = focusLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalCompletedSessionsCount = focusLogs.length;

  // Study time by subjects summary
  const getSubjectHourObj = () => {
    return subjects.map(s => {
      const mins = focusLogs
        .filter(l => l.subjectId === s.id)
        .reduce((sum, l) => sum + l.durationMinutes, 0);
      return { name: s.name, color: s.color, minutes: mins };
    }).sort((a, b) => b.minutes - a.minutes);
  };

  const subjectStudyMap = getSubjectHourObj();

  // Progress ring variables
  const initialSeconds = getInitialSeconds(mode);
  const progressPct = initialSeconds > 0 ? ((initialSeconds - secondsLeft) / initialSeconds) * 100 : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto" id="focus_study_tab">
      
      {/* Two panel bento-style design */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL A: POMODORO TIMER PANEL (Size span 8) */}
        <section className="bg-slate-900 border border-slate-800/85 p-6 rounded-3xl lg:col-span-8 flex flex-col items-center justify-center relative shadow-xl" id="pomodoro_timer_panel">
          
          <div className="text-center space-y-1 mb-6">
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
              <Clock className="h-5 w-5 text-indigo-400" />
              Focus & Study Room
            </h1>
            <p className="text-slate-400 text-xs">Run Pomodoro study loops, track timers, and avoid browser disruptions.</p>
          </div>

          {/* Mode Switch Pills */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex gap-1 text-[11px] font-bold mb-8">
            <button
              onClick={() => { setMode('pomodoro'); resetTimer('pomodoro'); }}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
                mode === 'pomodoro' ? 'bg-indigo-650/40 text-indigo-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => { setMode('short'); resetTimer('short'); }}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
                mode === 'short' ? 'bg-indigo-650/40 text-indigo-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => { setMode('long'); resetTimer('long'); }}
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
                mode === 'long' ? 'bg-indigo-650/40 text-indigo-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Long Break (15m)
            </button>
          </div>

          {/* CIRCULAR TIMER ELEMENT */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            {/* Background Circle Track */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-slate-950 fill-transparent"
                strokeWidth="10"
              />
              <motion.circle
                cx="128"
                cy="128"
                r={radius}
                className="stroke-indigo-500 fill-transparent"
                strokeWidth="10"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>

            {/* Timer digits */}
            <div className="text-center z-10">
              <span className="text-5xl font-black text-white tracking-tight tabular-nums block">
                {formatTime(secondsLeft)}
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest mt-1 block">
                {isActive ? 'Deep focus active' : 'Timer stopped'}
              </span>
            </div>
          </div>

          {/* COURSE INTEGRATION DROPDOWN */}
          <div className="w-full max-w-sm bg-slate-950 border border-slate-805 p-3 rounded-xl mb-6 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Study Course Target:</span>
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="bg-slate-900 text-xs font-bold text-slate-300 border border-slate-800 rounded-lg p-1 animate-fade-in focus:outline-none"
            >
              <option value="">No Course (General)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 w-full max-w-sm">
            <button
              onClick={toggleTimer}
              className={`flex-1 py-3.5 rounded-xl font-extrabold text-xs cursor-pointer tracking-wider text-white shadow-xl flex items-center justify-center gap-1.5 transition-all ${
                isActive 
                  ? 'bg-rose-650 hover:bg-rose-600' 
                  : 'bg-indigo-650 hover:bg-indigo-600'
              }`}
            >
              {isActive ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
              <span>{isActive ? 'PAUSE TIMER' : 'START STUDYING'}</span>
            </button>

            {isActive && (
              <button
                onClick={() => resetTimer()}
                className="px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-405 font-bold text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Notes Area */}
          <div className="mt-4 w-full max-w-sm">
            <textarea
              className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Session notes or summary (optional)..."
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
            />
          </div>

          {/* Quick preset sliders */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            {[10, 15, 25, 45, 60].map(mins => (
              <button
                key={mins}
                onClick={() => { setMode('custom'); setCustomMinutes(mins); }}
                className={`py-1.5 px-3 rounded-lg text-[10px] font-black tracking-wider uppercase border transition cursor-pointer ${
                  mode === 'custom' && customMinutes === mins
                    ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950 border-slate-850 text-slate-505 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                ⏱️ {mins}m presets
              </button>
            ))}
          </div>

        </section>

        {/* PANEL B: STUDY STATISTICS SIDEBAR (Size span 4) */}
        <section className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl lg:col-span-4 flex flex-col space-y-5" id="focus_stats_sidebar">
          
          {/* Target Milestone Ring */}
          <div className="bg-slate-950/45 p-4 rounded-2xl border border-slate-850 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-white">Daily Target Goal</p>
              <p className="text-[10px] text-slate-500 mt-1">Logged {focusMinutesToday} min of {profile.dailyStudyGoal} min daily target.</p>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-2">
                <div 
                  className="bg-indigo-500 h-full rounded-full" 
                  style={{ width: `${Math.min((focusMinutesToday / profile.dailyStudyGoal) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Subject hour summary tracker */}
          <div className="space-y-3 shrink-0">
            <h2 className="text-xs font-bold text-slate-205 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              Focus distribution
            </h2>
            
            <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
              {subjectStudyMap.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-bold py-3 text-center">No focus logs aggregated yet.</p>
              ) : (
                subjectStudyMap.map((course, idx) => (
                  <div key={idx} className="space-y-1 text-[11px] font-bold">
                    <div className="flex justify-between items-center text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                        <span className="truncate max-w-[120px]">{course.name}</span>
                      </div>
                      <span className="text-slate-400 text-xs font-bold">{course.minutes} min</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chronological Focus Timeline Stream */}
          <div className="space-y-3 flex-1 overflow-hidden flex flex-col justify-between">
            <h2 className="text-xs font-bold text-slate-205 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Calendar className="h-4 w-4 text-pink-400" />
              Focus session feed
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[200px]" id="sessions_chronological_feed">
              {focusLogs.length === 0 ? (
                <div className="py-8 text-center bg-slate-950/20 rounded-xl border border-slate-855 flex flex-col items-center p-3">
                  <Sparkles className="h-6 w-6 text-indigo-400 mb-1 opacity-50" />
                  <p className="text-[10px] text-slate-500 font-extrabold leading-normal">Your timeline is empty.</p>
                  <p className="text-[8px] text-slate-600 leading-normal">Complete Pomodoros above to display here.</p>
                </div>
              ) : (
                focusLogs.slice(0, 5).map((log, idx) => {
                  const s = subjects.find(sub => sub.id === log.subjectId);
                  return (
                    <div key={idx} className="p-2.5 bg-slate-950/40 border border-slate-855 rounded-xl flex justify-between items-center group hover:bg-slate-950/70 hover:border-slate-800 transition">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-200 block truncate">{s ? s.name : 'Focus Session'}</span>
                        <span className="text-[8px] text-slate-500 block mt-0.5">{log.dateTime}</span>
                        {log.notes && <p className="text-[9px] text-slate-400 mt-1 truncate max-w-[150px]">{log.notes}</p>}
                      </div>
                      <span className="text-[10px] font-black text-indigo-400 shrink-0 bg-indigo-500/10 py-1 px-2 rounded-lg">
                        +{log.durationMinutes}m
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}
