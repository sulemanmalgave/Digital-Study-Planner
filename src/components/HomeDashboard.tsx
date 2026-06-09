import React, { useState } from 'react';
import { Subject, ClassSchedule, Task, FocusLog, UserProfile } from '../types';
import { 
  BookOpen, Calendar, CheckSquare, Clock, Plus, Flame, Zap, 
  Activity, ArrowRight, Sparkles
} from 'lucide-react';

interface HomeDashboardProps {
  profile: UserProfile;
  subjects: Subject[];
  classes: ClassSchedule[];
  tasks: Task[];
  focusLogs: FocusLog[];
  onAddTask: (title: string, subjectId: string, dueDate: string, priority: 'Low' | 'Medium' | 'High') => boolean;
  onNavigate: (tab: string) => void;
  onToggleTask: (id: string) => void;
}

export default function HomeDashboard({
  profile,
  subjects,
  classes,
  tasks,
  focusLogs,
  onAddTask,
  onNavigate,
  onToggleTask,
}: HomeDashboardProps) {
  // Local state for inline quick add task form
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSubject, setQuickSubject] = useState('');
  const [quickPriority, setQuickPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [quickDueDate, setQuickDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const now = new Date();
  const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const todayStr = now.toISOString().split('T')[0];

  // Today's Day of Week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = daysOfWeek[now.getDay()];

  // Today's classes sorted by start time
  const todaysClasses = classes
    .filter(c => c.dayOfWeek?.toLowerCase() === todayDay?.toLowerCase())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Determine current active class/activity
  const activeClass = todaysClasses.find(
    c => c.startTime <= currentHourMin && c.endTime >= currentHourMin
  );

  // Find next upcoming class today
  const nextClass = todaysClasses.find(
    c => c.startTime > currentHourMin
  );

  // Focus time today
  const focusMinutesToday = focusLogs
    .filter(log => log.dateTime === todayStr)
    .reduce((sum, log) => sum + log.durationMinutes, 0);

  // Dynamic status details for the 3rd card ("Current or Next Activity")
  const getActiveOrNextActivity = () => {
    if (activeClass) {
      const subject = subjects.find(s => s.id === activeClass.subjectId);
      return {
        label: 'Active Now',
        title: activeClass.className || subject?.name || 'Class',
        sub: `${activeClass.startTime}-${activeClass.endTime}`,
        className: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
        isActive: true
      };
    }
    if (nextClass) {
      const subject = subjects.find(s => s.id === nextClass.subjectId);
      return {
        label: `Next at ${nextClass.startTime}`,
        title: nextClass.className || subject?.name || 'Class',
        sub: `Room: ${nextClass.room || 'N/A'}`,
        className: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
        isActive: false
      };
    }
    // If no classes, look for any uncompleted high-priority task due today
    const taskDueToday = tasks.find(t => !t.completed && t.dueDate === todayStr);
    if (taskDueToday) {
      const subject = subjects.find(s => s.id === taskDueToday.subjectId);
      return {
        label: 'Priority Homework',
        title: taskDueToday.title,
        sub: subject?.name || 'Today',
        className: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
        isActive: false
      };
    }

    return {
      label: 'Schedule',
      title: 'Free Slot',
      sub: 'All done today',
      className: 'text-slate-400 border-slate-800 bg-slate-950/20',
      isActive: false
    };
  };

  const activity = getActiveOrNextActivity();

  // Streak calculation (days with focus log or task completed)
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
        // Double check yesterday to keep streak active if they did things yesterday but not yet today
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

  // 4-6 Tasks without scrolling
  const upcomingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      const priorityWeight = { High: 3, Medium: 2, Low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    })
    .slice(0, 6);

  const pendingTasksCount = tasks.filter(t => !t.completed).length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) {
      setErrorMsg('Please enter a task title');
      return;
    }
    const success = onAddTask(
      quickTitle.trim(),
      quickSubject,
      quickDueDate,
      quickPriority
    );

    if (success) {
      setQuickTitle('');
      setErrorMsg('');
      setSuccessMsg('Task added successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);
      setShowQuickForm(false);
    } else {
      setErrorMsg('Task limit reached on Free plan (Upgrade in Profile)');
    }
  };

  return (
    <div className="space-y-3 pb-24 max-w-2xl mx-auto" id="home_screen_container">
      
      {/* Compact Minimal Header */}
      <header className="pt-2 pb-1 flex justify-between items-center" id="minimal_header">
        <div>
          <p className="text-[10px] md:text-[12px] text-slate-500 font-medium tracking-wide">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-lg md:text-xl font-semibold text-white mt-0.5">Hi, {profile.name} 👋</h1>
        </div>
        <button 
          onClick={() => onNavigate('profile')}
          className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold cursor-pointer hover:scale-105 transition-transform duration-200"
          aria-label="View Profile"
        >
          {profile.name.charAt(0)}
        </button>
      </header>
      
      {/* SECTION 1: TOP SUMMARY GRID (4 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" id="top_summary_row">
        
        {/* Card 1: Tasks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-1 px-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <CheckSquare className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block truncate">Tasks</span>
            <span className="text-sm font-extrabold text-white leading-none whitespace-nowrap block mt-0.5">
              {pendingTasksCount} Pending
            </span>
          </div>
        </div>

        {/* Card 2: Focus Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-1 px-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block truncate">Focus</span>
            <span className="text-sm font-extrabold text-white leading-none whitespace-nowrap block mt-0.5">
              {focusMinutesToday} min
            </span>
          </div>
        </div>

        {/* Card 3: Current or Next Activity */}
        <div className={`bg-slate-900 border rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm ${activity.className}`}>
          <div className="p-1 px-1.5 rounded-lg bg-slate-955 text-inherit shrink-0">
            {activity.isActive ? (
              <Activity className="h-4.5 w-4.5 animate-pulse" />
            ) : (
              <Calendar className="h-4.5 w-4.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block truncate">
              {activity.label}
            </span>
            <span className="text-xs font-bold text-slate-100 truncate block mt-0.5" title={activity.title}>
              {activity.title}
            </span>
          </div>
        </div>

        {/* Card 4: Subjects */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 shadow-sm">
          <div className="p-1 px-1.5 rounded-lg bg-pink-500/10 text-pink-400 shrink-0">
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block truncate">Subjects</span>
            <span className="text-sm font-extrabold text-white leading-none whitespace-nowrap block mt-0.5">
              {subjects.length} Courses
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 4: QUICK ACTIONS */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2" id="home_quick_actions_block">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
            Quick Actions
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Add Task Button */}
          <button 
            type="button"
            onClick={() => {
              setQuickPriority('Medium');
              setQuickTitle('');
              setShowQuickForm(!showQuickForm);
            }}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 tracking-tight transition cursor-pointer"
          >
            <Plus className="h-3 w-3 text-indigo-400" />
            <span>Add Task</span>
          </button>
          
          {/* Add Subject Button */}
          <button 
            type="button"
            onClick={() => onNavigate('planner')}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 tracking-tight transition cursor-pointer"
          >
            <Plus className="h-3 w-3 text-pink-400" />
            <span>Add Subject</span>
          </button>
          
          {/* Add Timetable Button */}
          <button 
            type="button"
            onClick={() => onNavigate('planner')}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 tracking-tight transition cursor-pointer"
          >
            <Plus className="h-3 w-3 text-emerald-400" />
            <span>Add Timetable</span>
          </button>
          
          {/* Start Focus Button */}
          <button 
            type="button"
            onClick={() => onNavigate('focus')}
            className="flex items-center justify-center gap-1.5 py-1 px-2.5 bg-indigo-600 hover:bg-indigo-505 text-white border border-indigo-500/20 rounded-lg text-[10px] font-bold tracking-tight transition cursor-pointer"
          >
            <Clock className="h-3 w-3" />
            <span>Start Focus</span>
          </button>
        </div>

        {/* Compact Quick Task Form */}
        {showQuickForm && (
          <form onSubmit={handleQuickAdd} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg space-y-2 animate-fade-in text-left">
            <div className="flex justify-between items-center pb-1 border-b border-slate-850">
              <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">
                Quick Task Creation
              </span>
              <button 
                type="button" 
                onClick={() => { setShowQuickForm(false); setErrorMsg(''); }}
                className="text-slate-500 hover:text-slate-300 text-[10px] font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-1.5">
              <div>
                <label className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. History homework page 12"
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Subject</label>
                  <select
                    value={quickSubject}
                    onChange={e => setQuickSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                  >
                    <option value="">-- No Subject --</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={quickDueDate}
                    onChange={e => setQuickDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <div>
                  <label className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-widest mb-0.5">Priority</label>
                  <select
                    value={quickPriority}
                    onChange={e => setQuickPriority(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-200 focus:outline-none"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-[10px] uppercase tracking-wide py-1 px-3 rounded transition-all cursor-pointer"
                  >
                    Save Task
                  </button>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-[10px] text-red-400 bg-red-950/25 p-1 rounded border border-red-900/40 mt-1">{errorMsg}</p>
            )}
          </form>
        )}

        {successMsg && (
          <p className="text-[10px] text-emerald-400 bg-emerald-950/25 p-1 rounded border border-emerald-900/40 text-center">{successMsg}</p>
        )}
      </section>

      {/* SECTION 2: TODAY'S TIMETABLE */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2" id="home_timetable_block">
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Today's Schedule ({todayDay})
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('planner')}
            className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold hover:underline cursor-pointer flex items-center"
          >
            Manage Timetable
          </button>
        </div>

        {/* Classes collection */}
        {todaysClasses.length === 0 ? (
          <div className="py-3 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            <p className="text-slate-500 text-xs">No classes scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {todaysClasses.map(cls => {
              const subject = subjects.find(s => s.id === cls.subjectId);
              const isCurrent = cls.startTime <= currentHourMin && cls.endTime >= currentHourMin;
              const subColor = subject ? subject.color : '#6366f1';
              const subName = subject ? subject.name : 'General';

              return (
                <div 
                  key={cls.id}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                    isCurrent 
                      ? 'bg-indigo-500/5 border border-indigo-505/35 ring-1 ring-indigo-500/20' 
                      : 'bg-slate-950/40 border border-slate-850 hover:bg-slate-950/60'
                  }`}
                  id={`class_item_${cls.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: subColor }} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                        {cls.className || subName}
                        {isCurrent && (
                          <span className="inline-flex items-center text-[8px] font-black bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded-full uppercase tracking-wider">
                            ● Happening Now
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {cls.startTime} - {cls.endTime} {cls.room && `• Rm ${cls.room}`}
                      </span>
                    </div>
                  </div>

                  <span className="text-[9px] font-extrabold text-slate-450 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded truncate max-w-[120px]">
                    {subName}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: UPCOMING TASKS (Compact List, 4-6 items without scrolling) */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2" id="home_tasks_block">
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Upcoming Checklist
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('tasks')}
            className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold hover:underline cursor-pointer"
          >
            Checklist View
          </button>
        </div>

        {/* Tasks rows */}
        {upcomingTasks.length === 0 ? (
          <div className="py-3 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            <p className="text-slate-550 text-xs">Nice job! All tasks completed. 🚀</p>
          </div>
        ) : (
          <div className="space-y-1">
            {upcomingTasks.map(task => {
              const subject = subjects.find(s => s.id === task.subjectId);
              const subColor = subject ? subject.color : '#475569';
              const subName = subject ? subject.name : 'General';
              
              const parsedDueDate = new Date(task.dueDate + 'T12:00:00');
              const isOverdue = !task.completed && parsedDueDate < new Date(new Date().setHours(0,0,0,0));

              return (
                <div 
                  key={task.id}
                  className="flex items-center justify-between p-1.5 bg-slate-950/40 border border-slate-850 rounded-lg hover:bg-slate-950/60 transition-colors"
                  id={`home_task_item_${task.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask(task.id)}
                      className="h-3.5 w-3.5 rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-0 accent-indigo-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{task.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500 font-semibold">
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: subColor }} />
                        <span className="truncate max-w-[80px]">{subName}</span>
                        <span>•</span>
                        <span className={isOverdue ? 'text-red-400 font-black' : ''}>
                          {isOverdue ? `Overdue (${task.dueDate})` : task.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[8px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                    task.priority === 'High' 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : task.priority === 'Medium' 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {task.priority || 'Medium'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}

