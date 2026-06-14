import React, { useState } from 'react';
import { Subject, ClassSchedule, Task, FocusLog, UserProfile } from '../types';
import { 
  BookOpen, Calendar as CalendarIcon, CheckSquare, Clock, Plus, Flame, Zap, 
  Activity, ArrowRight, Sparkles, AlertCircle, Award, CheckCircle2, Search, Bell
} from 'lucide-react';
import { motion } from 'motion/react';

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
  const todayStr = now.toISOString().split('T')[0];

  // Helper: Days of Week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = daysOfWeek[now.getDay()];

  // Stats Card Calculations
  // 1. Pending Assignments
  const pendingAssignmentsCount = tasks.filter(t => !t.completed && (t.type === 'Assignment' || t.type === 'Task')).length;

  // 2. Upcoming Exams
  const upcomingExamsCount = tasks.filter(t => !t.completed && t.type === 'Exam').length;

  // 3. Study Hours
  const totalFocusMinutes = focusLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalStudyHours = (totalFocusMinutes / 60).toFixed(1);

  // 4. Completion Rate
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Today's Tasks list (completed = false, dueDate = today)
  const todaysTasks = tasks.filter(t => t.dueDate === todayStr && !t.completed);

  // Upcoming Exams list
  const upcomingExams = tasks
    .filter(t => t.type === 'Exam' && !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // Determine Countdown for Exam
  const getExamCountdown = (dueDateStr: string) => {
    const today = new Date(todayStr + 'T12:00:00');
    const examDate = new Date(dueDateStr + 'T12:00:00');
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today!';
    if (diffDays < 0) return 'Overdue';
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} left`;
  };

  // Generate Current Weekly Calendar Dates
  const getWeekDates = () => {
    const currentDayIndex = now.getDay(); // 0 is Sun, 1 is Mon...
    const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex; // Start week on Monday
    const week = [];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime());
      d.setDate(now.getDate() + mondayOffset + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates();

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
      setErrorMsg('Limit reached on Free plan (Upgrade in Settings)');
    }
  };

  return (
    <div className="space-y-6 pb-20 w-full max-w-7xl mx-auto" id="home_screen_container">
      
      {/* SECTION 1: STATISTICS ROW (Top Stats Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="top_stats_cards_row">
        
        {/* Card 1: Pending Assignments */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition" id="stat_pending_assignments">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Pending Tasks</span>
            <span className="text-xl font-black text-white mt-1 block">
              {pendingAssignmentsCount} Tasks
            </span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Upcoming Exams */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition" id="stat_upcoming_exams">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-455 shrink-0">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Upcoming Exams</span>
            <span className="text-xl font-black text-white mt-1 block">
              {upcomingExamsCount} Exams
            </span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Study Hours */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition" id="stat_study_hours">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Study Hours</span>
            <span className="text-xl font-black text-white mt-1 block">
              {totalStudyHours} hrs
            </span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Completion Rate */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group hover:border-slate-700 transition" id="stat_completion_rate">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Completion Rate</span>
            <span className="text-xl font-black text-white mt-1 block">
              {completionRate}%
            </span>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-505/5 rounded-full blur-xl pointer-events-none" />
        </div>

      </div>

      {/* QUICK ADD ACTION ROW BAR & BUTTONS */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3" id="home_quick_dashboard_controls">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Zap className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
          <span>Quick Student Workspace Controls</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button 
            onClick={() => setShowQuickForm(!showQuickForm)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-250 hover:bg-slate-900 cursor-pointer flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5 text-indigo-400" />
            <span>Add Task</span>
          </button>
          <button 
            onClick={() => onNavigate('planner')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-250 hover:bg-slate-900 cursor-pointer flex items-center gap-1.5 transition"
          >
            <Plus className="h-3.5 w-3.5 text-pink-400" />
            <span>Schedule Class</span>
          </button>
          <button 
            onClick={() => onNavigate('notes')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-slate-250 hover:bg-slate-900 cursor-pointer flex items-center gap-1.5 transition"
          >
            <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
            <span>Write Note</span>
          </button>
          <button 
            onClick={() => onNavigate('focus')}
            className="px-4 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition"
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Focus Now</span>
          </button>
        </div>

        {/* Quick Task creation popup drawer */}
        {showQuickForm && (
          <form onSubmit={handleQuickAdd} className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3.5 animate-fade-in-down text-left mt-2">
            <div className="flex justify-between items-center pb-2 border-b border-slate-850">
              <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider block">
                Quick Homework Intake
              </span>
              <button 
                type="button" 
                onClick={() => { setShowQuickForm(false); setErrorMsg(''); }}
                className="text-slate-500 hover:text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read Physics Chapter 3"
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Course Subject</label>
                <select
                  value={quickSubject}
                  onChange={e => setQuickSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">-- No Subject --</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Due Date</label>
                <input
                  type="date"
                  required
                  value={quickDueDate}
                  onChange={e => setQuickDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['Low', 'Medium', 'High'] as const).map(pr => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setQuickPriority(pr)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        quickPriority === pr
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 bg-red-950/20 p-2 rounded border border-red-900/30">{errorMsg}</p>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs rounded-lg cursor-pointer shadow transition"
              >
                Add Assignment
              </button>
            </div>
          </form>
        )}

        {successMsg && (
          <p className="w-full text-xs text-emerald-400 bg-emerald-950/20 p-2 rounded border border-emerald-900/30 text-center">{successMsg}</p>
        )}
      </div>

      {/* SECTION 2: THE TRIPLE BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5" id="home_bento_columns">
        
        {/* COLUMN 1: TODAY'S TASKS (Left) - Size span 3 */}
        <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 lg:col-span-3 flex flex-col space-y-3 shadow-md" id="column_today_tasks">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-orange-400" />
              Today's Tasks
            </h2>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-extrabold px-1.5 py-0.2 rounded">
              {todaysTasks.length} left
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 p-0.5 max-h-[400px] md:max-h-[500px]" id="today_tasks_checklist">
            {todaysTasks.length === 0 ? (
              <div className="py-12 bg-slate-950/30 rounded-xl border border-dashed border-slate-850 text-center flex flex-col items-center justify-center p-4">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2 opacity-60" />
                <p className="text-slate-400 text-xs font-bold">All clear for today!</p>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">No pending assignments or due items today.</p>
              </div>
            ) : (
              todaysTasks.map(task => {
                const sub = subjects.find(s => s.id === task.subjectId);
                const subColor = sub ? sub.color : '#64748b';
                return (
                  <div 
                    key={task.id}
                    className="p-3 bg-slate-950/35 border border-slate-850 rounded-xl hover:border-slate-800 hover:bg-slate-950/60 transition-all flex items-start gap-2.5 relative group"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask(task.id)}
                      className="mt-0.5 h-4 w-4 bg-slate-900 border-slate-800 rounded text-indigo-650 focus:ring-0 accent-indigo-500 cursor-pointer shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-200 leading-snug group-hover:text-white transition truncate" title={task.title}>
                        {task.title}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: subColor }} />
                        <span className="text-[10px] text-slate-500 font-semibold truncate max-w-[90px]">{sub ? sub.name : 'General'}</span>
                        <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            onClick={() => onNavigate('tasks')}
            className="w-full text-center py-2 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-950 rounded-xl cursor-pointer transition mt-2 flex items-center justify-center gap-1"
          >
            <span>Go to Tasks checklist</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </section>

        {/* COLUMN 2: WEEKLY CALENDAR (Center) - Size span 6 */}
        <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 lg:col-span-6 flex flex-col space-y-3" id="column_weekly_schedule">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <h2 className="text-xs font-bold text-slate-205 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-indigo-400" />
              Weekly Overview
            </h2>
            <button 
              onClick={() => onNavigate('planner')}
              className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black tracking-wide"
            >
              MONTH VIEW
            </button>
          </div>

          {/* 7 Columns or Rows for week overview */}
          <div className="flex-1 space-y-1.5 max-h-[500px] overflow-y-auto pr-1" id="weekly_grid_rows">
            {weekDates.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayName = daysOfWeek[date.getDay()];
              const isToday = todayStr === dateStr;
              
              // Get scheduled elements for this date
              const dayClasses = classes.filter(c => c.dayOfWeek?.toLowerCase() === dayName?.toLowerCase());
              const dayTasks = tasks.filter(t => t.dueDate === dateStr && !t.completed);

              const totalItems = dayClasses.length + dayTasks.length;

              return (
                <div 
                  key={index}
                  className={`p-2.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                    isToday 
                      ? 'bg-indigo-650/5 border-indigo-500/40 shadow-sm shadow-indigo-500/5' 
                      : 'bg-slate-950/20 border-slate-850'
                  }`}
                >
                  {/* Left Date indicator */}
                  <div className="w-16 shrink-0 flex items-center sm:flex-col justify-start sm:justify-center text-left sm:text-center border-b sm:border-b-0 sm:border-r border-slate-850 pb-1 sm:pb-0 sm:pr-2.5">
                    <span className="text-[10px] font-extrabold text-indigo-400 block uppercase tracking-wide leading-none">{dayName.slice(0, 3)}</span>
                    <span className={`text-sm font-extrabold mt-0.5 ml-1.5 sm:ml-0 ${isToday ? 'text-white' : 'text-slate-400'}`}>
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Schedule items for that day */}
                  <div className="flex-1 flex flex-wrap gap-1.5" id={`week_schedule_cell_${dateStr}`}>
                    {totalItems === 0 ? (
                      <span className="text-[10px] text-slate-600 font-semibold self-center">Free Day 🎉</span>
                    ) : (
                      <>
                        {dayClasses.map(cls => {
                          const sub = subjects.find(s => s.id === cls.subjectId);
                          return (
                            <span 
                              key={cls.id}
                              className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 max-w-[130px] truncate block hover:border-slate-600 transition"
                              title={`${cls.className || sub?.name} (${cls.startTime}-${cls.endTime})`}
                            >
                              ⌚ {cls.className || sub?.name}
                            </span>
                          );
                        })}

                        {dayTasks.map(t => {
                          const sub = subjects.find(s => s.id === t.subjectId);
                          const subColor = sub ? sub.color : '#4f46e5';
                          return (
                            <span 
                              key={t.id}
                              className="text-[9px] font-bold px-2 py-0.5 rounded-md text-slate-200 border truncate block max-w-[150px] transition"
                              style={{ backgroundColor: `${subColor}15`, borderColor: `${subColor}30` }}
                              title={`Task: ${t.title}`}
                            >
                              📋 {t.title}
                            </span>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* COLUMN 3: UPCOMING EXAMS AND DEADLINES (Right) - Size span 3 */}
        <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 lg:col-span-3 flex flex-col space-y-3 shadow-md" id="column_upcoming_exams">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <h2 className="text-xs font-bold text-slate-220 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-rose-455 animate-pulse" />
              Exams Countdown
            </h2>
            <Award className="h-4 w-4 text-amber-400" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[400px] md:max-h-[500px]" id="exams_countdowns_list">
            {upcomingExams.length === 0 ? (
              <div className="py-12 bg-slate-950/30 rounded-xl border border-dashed border-slate-850 text-center flex flex-col items-center p-4">
                <p className="text-slate-450 text-xs font-bold">No upcoming exams!</p>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Relax or create study sessions in Focus tab.</p>
              </div>
            ) : (
              upcomingExams.map(exam => {
                const sub = subjects.find(s => s.id === exam.subjectId);
                const subColor = sub ? sub.color : '#ec4899';
                const countdown = getExamCountdown(exam.dueDate);

                return (
                  <div 
                    key={exam.id}
                    className="p-3 bg-slate-950/35 border border-slate-850 rounded-xl hover:border-slate-800 hover:bg-slate-950/60 transition flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-extrabold text-xs text-slate-200 line-clamp-1 truncate block leading-snug">
                        {exam.title}
                      </span>
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded shrink-0 uppercase tracking-wider ${
                        countdown === 'Today!' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {countdown}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: subColor }} />
                        <span className="text-[9px] text-slate-400 font-bold max-w-[80px] truncate">{sub ? sub.name : 'General'}</span>
                      </div>
                      
                      <span className="text-[9px] text-slate-500 font-semibold">{exam.dueDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <button 
            type="button"
            onClick={() => onNavigate('timetable')}
            className="w-full text-center py-2 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-950 rounded-xl cursor-pointer transition mt-2 flex items-center justify-center gap-1"
          >
            <span>View School Timetable</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </section>

      </div>

    </div>
  );
}
