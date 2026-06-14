import React from 'react';
import { Subject, Task, FocusLog, UserProfile } from '../types';
import { 
  Flame, Award, CheckSquare, Clock, TrendingUp, Sparkles, Calendar, BookOpen, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProgressViewProps {
  subjects: Subject[];
  tasks: Task[];
  focusLogs: FocusLog[];
  profile: UserProfile;
}

export default function ProgressView({ subjects, tasks, focusLogs, profile }: ProgressViewProps) {
  // Focus minutes and stats
  const totalFocusMinutes = focusLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Streak calculation
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

  // Calculate study hours per day of current week
  const getWeeklyHoursData = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result = daysOfWeek.map((day, index) => {
      // Find date of that weekday in the current week
      const currentDay = now.getDay();
      const diff = index - currentDay;
      const targetDate = new Date(now.getTime() + diff * 86400000);
      const dateStr = targetDate.toISOString().split('T')[0];
      
      const dayMinutes = focusLogs
        .filter(log => log.dateTime === dateStr)
        .reduce((sum, log) => sum + log.durationMinutes, 0);
      
      return {
        day,
        minutes: dayMinutes,
        hours: parseFloat((dayMinutes / 60).toFixed(1)),
        isToday: index === currentDay
      };
    });
    return result;
  };

  const weeklyData = getWeeklyHoursData();
  const maxWeeklyHours = Math.max(...weeklyData.map(d => d.hours), 1);

  // Focus time by course
  const getCourseBreakdown = () => {
    return subjects.map(sub => {
      const mins = focusLogs
        .filter(log => log.subjectId === sub.id)
        .reduce((sum, log) => sum + log.durationMinutes, 0);
      return {
        name: sub.name,
        color: sub.color,
        minutes: mins,
        hours: parseFloat((mins / 60).toFixed(1))
      };
    }).sort((a, b) => b.minutes - a.minutes);
  };

  const courseBreakdown = getCourseBreakdown();
  const totalSubjectMinutes = courseBreakdown.reduce((sum, c) => sum + c.minutes, 0) || 1;

  // Study hours goal progress
  const todayStr = new Date().toISOString().split('T')[0];
  const focusMinutesToday = focusLogs
    .filter(log => log.dateTime === todayStr)
    .reduce((sum, log) => sum + log.durationMinutes, 0);
  const dailyProgressRate = Math.min(Math.round((focusMinutesToday / profile.dailyStudyGoal) * 100), 100);

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto" id="progress_workspace">
      
      {/* Header bar */}
      <header className="p-4 bg-slate-900/60 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            Performance & Insights
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Check your study patterns, daily statistics and overall completion ratings.</p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl">
            <Flame className="h-4 w-4 text-orange-500 fill-orange-500/10" />
            <span className="text-xs font-extrabold text-slate-200">{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-650/10 border border-indigo-500/20 rounded-xl">
            <Award className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-extrabold text-indigo-300">Level {Math.floor(totalFocusMinutes / 300) + 1}</span>
          </div>
        </div>
      </header>

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4" id="stats_row_cards">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Focused Hours</p>
            <p className="text-xl font-black text-slate-100 mt-1">{totalFocusHours} hrs</p>
            <p className="text-[10px] text-indigo-400/80 mt-0.5">Total sessions logged</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tasks Completed</p>
            <p className="text-xl font-black text-slate-100 mt-1">{completedTasks} / {totalTasks}</p>
            <p className="text-[10px] text-emerald-400/80 mt-0.5">{taskCompletionRate}% rate</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Streak</p>
            <p className="text-xl font-black text-slate-100 mt-1">{streak} Days</p>
            <p className="text-[10px] text-orange-400/80 mt-0.5">Keep studying daily!</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 shrink-0">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today's Study Goal</p>
            <p className="text-xl font-black text-slate-100 mt-1">{focusMinutesToday} / {profile.dailyStudyGoal}m</p>
            <p className="text-[10px] text-pink-405 mt-0.5">{dailyProgressRate}% achieved</p>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Productivity Chart Card */}
        <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 lg:col-span-7 flex flex-col">
          <div className="flex justify-between items-center pb-4 border-b border-slate-850">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Weekly Study Chart</h2>
              <p className="text-[10px] text-slate-500">Track hours spent focused each day</p>
            </div>
            <span className="text-[10px] font-semibold text-indigo-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Current week</span>
          </div>

          <div className="flex-1 min-h-[220px] flex items-end justify-between px-2 pt-6 pb-2" id="weekly_bars_svg">
            {weeklyData.map(d => {
              const pct = (d.hours / maxWeeklyHours) * 100;
              return (
                <div key={d.day} className="flex flex-col items-center gap-3 group flex-1">
                  <div className="w-full text-center relative h-[150px] flex items-end justify-center">
                    {/* Tooltip */}
                    <span className="absolute -top-6 bg-slate-950 border border-slate-800 text-[9px] font-bold text-indigo-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition duration-150 shadow pointer-events-none">
                      {d.hours} hrs
                    </span>
                    
                    {/* Bar */}
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 5)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`w-4 sm:w-6 rounded-t-lg transition ${
                        d.isToday 
                          ? 'bg-gradient-to-t from-indigo-700 to-indigo-400 shadow-md shadow-indigo-505/20' 
                          : 'bg-slate-850 group-hover:bg-indigo-650/40'
                      }`}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${d.isToday ? 'text-indigo-400 font-extrabold' : 'text-slate-500'}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Course breakdowns list */}
        <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 lg:col-span-5 flex flex-col">
          <div className="flex justify-between items-center pb-4 border-b border-slate-850 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-slate-200">Course Distribution</h2>
              <p className="text-[10px] text-slate-500">Distribution of accumulated study time</p>
            </div>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>

          <div className="flex-1 overflow-y-auto pt-4 space-y-3.5 pr-1 max-h-[220px]">
            {courseBreakdown.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-slate-500">No focus logs logged yet</p>
              </div>
            ) : (
              courseBreakdown.map(course => {
                const pct = Math.round((course.minutes / totalSubjectMinutes) * 100);
                return (
                  <div key={course.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                        <span className="font-bold text-slate-300">{course.name}</span>
                      </div>
                      <span className="font-black text-slate-400">{course.hours} hrs ({pct}%)</span>
                    </div>

                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: course.color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Goal Ring Section */}
      <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-slate-200 border-b border-slate-850 pb-3 mb-4">Milestones & Certifications</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-200">First Steps</p>
              <p className="text-[10px] text-slate-500 mt-1">Logged your first study session</p>
              <div className="text-[8px] uppercase tracking-wider font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded mt-1.5 inline-block border border-amber-500/15">
                COMPLETED
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${totalFocusMinutes >= 300 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-200">Focus Elite</p>
              <p className="text-[10px] text-slate-500 mt-1">Accumulated 5 hours of total study</p>
              <div className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded mt-1.5 inline-block border ${totalFocusMinutes >= 300 ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/15' : 'text-slate-600 bg-slate-900 border-slate-800'}`}>
                {totalFocusMinutes >= 300 ? 'COMPLETED' : `${Math.floor(totalFocusMinutes)} / 300m`}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${streak >= 5 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-slate-900 text-slate-600 border-slate-800'}`}>
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-xs text-slate-200">Consistency Master</p>
              <p className="text-[10px] text-slate-500 mt-1">Maintain a 5-day study streak</p>
              <div className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded mt-1.5 inline-block border ${streak >= 5 ? 'text-orange-400 bg-orange-500/10 border-orange-500/15' : 'text-slate-600 bg-slate-900 border-slate-800'}`}>
                {streak >= 5 ? 'COMPLETED' : `${streak} / 5 Days`}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
