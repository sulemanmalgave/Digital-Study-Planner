import React, { useState } from 'react';
import { UserProfile, Task, FocusLog, Subject } from '../types';
import { 
  User, Shield, Sparkles, Check, Heart, Moon, Sun, Clock, Save, 
  Flame, CheckSquare, Award, BookOpen, ChevronRight, Lock, Unlock, Sliders, Trash2 
} from 'lucide-react';

interface ProfileViewProps {
  profile: any;
  tasks: Task[];
  focusLogs: FocusLog[];
  subjects: Subject[];
  subjectsCount: number;
  classesCount: number;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAddSubject: (name: string, color: string) => Promise<boolean>;
  onDeleteSubject: (id: string) => Promise<void>;
}

export default function ProfileView({
  profile,
  tasks,
  focusLogs,
  subjects,
  subjectsCount,
  classesCount,
  onUpdateProfile,
  onAddSubject,
  onDeleteSubject,
}: ProfileViewProps) {
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState(profile.grade || '');
  const [dailyGoal, setDailyGoal] = useState(profile.dailyStudyGoal);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States for Subject manager
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState('#6366f1');
  const [subSuccess, setSubSuccess] = useState('');
  const [subError, setSubError] = useState('');

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim(),
      grade: grade.trim(),
      dailyStudyGoal: Number(dailyGoal),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const togglePlan = () => {
    const nextPlan = profile.planType === 'Free' ? 'Premium' : 'Free';
    onUpdateProfile({ planType: nextPlan });
  };

  // 1. Calculate General Metrics
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const pendingTasksCount = tasks.filter(t => !t.completed).length;
  const totalFocusMinutes = focusLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  // 2. Active Study Streak Calculation (days with any activity)
  const calculateStreak = () => {
    const datesWithActivity = new Set<string>();
    focusLogs.forEach(l => datesWithActivity.add(l.dateTime));
    tasks.forEach(t => t.completedAt && datesWithActivity.add(t.completedAt));
    
    let currentStreak = 0;
    const checkDate = new Date();
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (datesWithActivity.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Double check yesterday to keep streak active if user opened today but did not finish anything yet
        if (currentStreak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toISOString().split('T')[0];
          if (datesWithActivity.has(yesterdayStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }
    return currentStreak;
  };

  const streak = calculateStreak();

  // 3. Student Achievements List (Evaluated on-the-fly dynamically)
  const ACHIEVEMENTS = [
    {
      id: 'first_task',
      title: 'First Step',
      description: 'Mark your very first task as completed.',
      icon: '🎯',
      isUnlocked: completedTasksCount >= 1,
    },
    {
      id: 'focus_pioneer',
      title: 'Deep Work Pioneer',
      description: 'Accumulate 25 or more study focus minutes.',
      icon: '🧠',
      isUnlocked: totalFocusMinutes >= 25,
    },
    {
      id: 'syllabus',
      title: 'Syllabus Architect',
      description: 'Enroll 3 or more subjects on your planner.',
      icon: '📚',
      isUnlocked: subjectsCount >= 3,
    },
    {
      id: 'consistent',
      title: 'Consistent Scholar',
      description: 'Achieve an active study streak of 2+ days.',
      icon: '🔥',
      isUnlocked: streak >= 2,
    },
    {
      id: 'high_priority',
      title: 'Exam Conqueror',
      description: 'Complete at least 3 High-Priority tasks.',
      icon: '🏆',
      isUnlocked: tasks.filter(t => t.completed && t.priority === 'High').length >= 3,
    },
    {
      id: 'unlocked_all',
      title: 'Overachiever',
      description: 'Unlock Premium access plan tier.',
      icon: '👑',
      isUnlocked: profile.planType === 'Premium',
    }
  ];

  return (
    <div className="space-y-4" id="profile_tab">
      
      {/* Mini Profile Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-900/60 rounded-xl border border-slate-800 gap-3">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            <User className="h-4.5 w-4.5 text-indigo-400" />
            Student Profile Hub
          </h1>
          <p className="text-slate-400 text-[11px] mt-0.5">Track your long-term study milestones, unlock achievements, and edit account settings.</p>
        </div>

        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          Academic Profile Mode
        </span>
      </div>

      {/* Grid structure: Left Side (Small Avatar + Statistics + Achievements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Aspect (Column 7/12 units): Avatar, Stats & Gamified Badges */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Avatar and Stats Header Card (Information Dense) */}
          <div className="bg-slate-900/20 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4">
            
            {/* Custom Interactive Avatar Color background selector */}
            <div className={`w-14 h-14 rounded-full ${profile.avatarColor || 'bg-indigo-600'} text-white flex items-center justify-center text-lg font-black uppercase ring-4 ring-indigo-500/10 shrink-0 select-none transition-colors duration-350`}>
              {(profile.name || 'User').slice(0, 2)}
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                  {profile.name}
                </h2>
                
                {/* Avatar Presets rows */}
                <div className="flex items-center justify-center sm:justify-start gap-1 p-1 bg-slate-950/40 rounded-full border border-slate-850/60 w-fit mx-auto sm:mx-0">
                  {['bg-indigo-600', 'bg-rose-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-cyan-600'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdateProfile({ avatarColor: color })}
                      className={`w-3 h-3 rounded-full border border-transparent cursor-pointer ${color} ${profile.avatarColor === color ? 'ring-2 ring-indigo-400 scale-125' : 'hover:scale-115'} transition-all`}
                      title="Select avatar color theme"
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-450 text-xs">{profile.grade || 'Undergraduate Student'}</p>
              
              {/* Short stats summary chips in avatar line */}
              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start mt-2">
                <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-850/60 text-slate-400">
                  Plan: <span className="text-indigo-450 font-bold">{profile.planType}</span>
                </span>
                <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-850/60 text-slate-400">
                  Classes: <span className="text-slate-200 font-bold">{classesCount} slots</span>
                </span>
              </div>
            </div>
          </div>

          {/* Core study statistics blocks */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Stats 1: Streak */}
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850/80 text-center flex flex-col justify-center">
              <div className="p-1 w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 mx-auto mb-1 flex items-center justify-center">
                <Flame className="h-4 w-4 fill-amber-500/15" />
              </div>
              <span className="text-base font-black text-white block">{streak} Days</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Active Streak</span>
            </div>

            {/* Stats 2: Completed checklists */}
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850/80 text-center flex flex-col justify-center">
              <div className="p-1 w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 mx-auto mb-1 flex items-center justify-center">
                <CheckSquare className="h-4 w-4" />
              </div>
              <span className="text-base font-black text-white block">{completedTasksCount}/{totalTasksCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Tasks Completed</span>
            </div>

            {/* Stats 3: Focus Hours logged */}
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850/80 text-center flex flex-col justify-center">
              <div className="p-1 w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 mx-auto mb-1 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <span className="text-base font-black text-white block">{totalFocusHours} Hrs</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide block">Study Time</span>
            </div>
          </div>

          {/* Gamified Achievements List (Highly compact details row) */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center pb-1.5 border-b border-slate-850">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" />
                Student Academic Badges
              </h3>
              <span className="text-[10px] text-slate-550 font-bold">
                Unlocked {ACHIEVEMENTS.filter(a => a.isUnlocked).length} / {ACHIEVEMENTS.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
              {ACHIEVEMENTS.map(ach => (
                <div 
                  key={ach.id}
                  className={`p-2 rounded-lg border transition-all flex items-center gap-2.5 ${
                    ach.isUnlocked 
                      ? 'bg-slate-950/40 border-amber-500/20' 
                      : 'bg-slate-950/10 border-slate-900 opacity-45'
                  }`}
                >
                  <span className="text-xl select-none" role="img" aria-label="badge-emoji">{ach.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 justify-between">
                      <h4 className="text-xs font-extrabold text-slate-205 truncate">{ach.title}</h4>
                      {ach.isUnlocked ? (
                        <Unlock className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                      ) : (
                        <Lock className="h-2.5 w-2.5 text-slate-650 shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 leading-relaxed truncate">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Aspect (Column 5/12 units): Account Settings & plan Toggle */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Personal Settings Form */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider pb-1.5 border-b border-slate-850/60 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-indigo-400" />
              Configure Settings
            </h3>

            <form onSubmit={handleUpdate} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider mb-0.5">Student Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-202 focus:outline-none focus:border-indigo-505"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider mb-0.5">Academic Grade / Year</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Undergraduate"
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-202 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-405 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  Daily Study Goal (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  required
                  value={dailyGoal}
                  onChange={e => setDailyGoal(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-202 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Theme toggle panel */}
              <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded-lg border border-slate-850 mt-1">
                <span className="text-[11px] font-semibold text-slate-400">Dark Styling theme (default)</span>
                <button 
                  type="button"
                  onClick={() => onUpdateProfile({ darkMode: !profile.darkMode })}
                  className="p-1 px-2 rounded-md bg-slate-900 border border-slate-800 text-indigo-400 hover:text-white"
                  title="Toggle dark layout"
                >
                  {profile.darkMode ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                </button>
              </div>

              {saveSuccess && (
                <div className="text-emerald-400 text-[10px] bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20 text-center animate-fade-in">
                  Profile options successfully saved!
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Save className="h-3 w-3" /> Save Changes
              </button>
            </form>
          </div>

          {/* Subject Management Card (Dynamic, CRUD operations) */}
          <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-350 uppercase tracking-wider pb-1.5 border-b border-slate-850/60 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-pink-400" />
              Manage Course Subjects
            </h3>

            {/* List of subjects */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-0.5" id="subjects_profile_list">
              {subjects.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-2">No custom courses registered yet.</p>
              ) : (
                subjects.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-1.5 bg-slate-950/40 border border-slate-850/40 rounded text-xs animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-200 font-bold truncate">{s.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${s.name}"? Dynamic timetable schedules and checklists associated under this course will be cascades-cleared.`)) {
                          onDeleteSubject(s.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-0.5 cursor-pointer transition-colors shrink-0"
                      title="Delete subject"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add course subject */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newSubName.trim()) return;
              if (profile.planType === 'Free' && subjects.length >= 10) {
                setSubError('Course limit reached on Free plan (Upgrade simulation below!)');
                return;
              }
              const ok = await onAddSubject(newSubName.trim(), newSubColor);
              if (ok) {
                setNewSubName('');
                setSubError('');
                setSubSuccess('Course registered successfully!');
                setTimeout(() => setSubSuccess(''), 2000);
              }
            }} className="space-y-2 pt-2 border-t border-slate-850/60">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Register Course / Subject</span>
              
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="e.g. Modern Physics"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
                
                <select 
                  value={newSubColor} 
                  onChange={e => setNewSubColor(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-1.5 text-[11px] text-slate-350 focus:outline-none"
                >
                  <option value="#6366f1">💜 Purple</option>
                  <option value="#10b981">💚 Green</option>
                  <option value="#ef4444">❤️ Red</option>
                  <option value="#f59e0b">💛 Amber</option>
                  <option value="#a855f7">🟣 Lavender</option>
                  <option value="#06b6d4">💙 Cyan</option>
                  <option value="#ec4899">💖 Pink</option>
                </select>

                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs px-3 rounded flex items-center justify-center cursor-pointer transition"
                >
                  Create
                </button>
              </div>

              {subSuccess && <p className="text-[9px] text-emerald-400 bg-emerald-950/20 p-1 rounded border border-emerald-900/40 text-center animate-fade-in">{subSuccess}</p>}
              {subError && <p className="text-[9px] text-rose-400 bg-rose-950/20 p-1 rounded border border-rose-900/40 text-center">{subError}</p>}
            </form>
          </div>

          {/* Premium upgrades simulator module */}
          <div className="bg-radial from-indigo-950/20 to-slate-950 border border-indigo-500/15 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
            <div className="z-10">
              <div className="flex items-center justify-between pb-1.5 border-b border-indigo-500/10">
                <h4 className="font-extrabold text-white text-xs flex items-baseline gap-1">
                  Saas Tier: <span className="text-indigo-400 font-black">{profile.planType}</span>
                </h4>
                <span className="text-[8px] bg-indigo-650 text-white font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-widest">
                  Limits Safe
                </span>
              </div>

              <div className="space-y-1.5 mt-2.5 text-[10px] text-slate-400">
                <div className="flex justify-between border-b border-slate-850/40 pb-1">
                  <span>Linked Courses:</span>
                  <span className="text-slate-200 font-bold">{subjectsCount} / {profile.planType === 'Free' ? '10' : '∞'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850/40 pb-1">
                  <span>Schedules Added:</span>
                  <span className="text-slate-200 font-bold">{classesCount} / {profile.planType === 'Free' ? '10' : '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Checklist Total:</span>
                  <span className="text-slate-200 font-bold">{totalTasksCount} / {profile.planType === 'Free' ? '50' : '∞'}</span>
                </div>
              </div>

              {profile.planType === 'Free' ? (
                <div className="mt-2.5 p-2 bg-slate-950/50 rounded border border-slate-850/60 text-[9px] text-slate-500">
                  <p className="font-bold text-indigo-400">Get Unlimited Power Study Slots:</p>
                  <p className="mt-0.5 leading-relaxed">Upgrade unlocks unlimited course rows, custom schedule cards and checklist additions instantly.</p>
                </div>
              ) : (
                <div className="mt-2.5 p-2 bg-indigo-950/10 rounded border border-indigo-500/10 text-[9px] text-indigo-400 leading-relaxed">
                  ✓ Premium active. All limits are completely removed. Have a wonderful semester!
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={togglePlan}
              className={`w-full mt-3.5 py-1.5 rounded-lg font-bold text-[11px] uppercase tracking-wide cursor-pointer transition ${
                profile.planType === 'Free'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-400'
              }`}
            >
              {profile.planType === 'Free' ? 'Simulate Upgrade (Gain Access)' : 'Downgrade to Free Tier'}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
