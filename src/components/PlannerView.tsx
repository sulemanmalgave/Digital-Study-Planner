import React, { useState } from 'react';
import { Subject, ClassSchedule, Task } from '../types';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Layers, Target, Trash2, Edit2, AlertCircle, GripVertical, CheckCircle2, ListFilter
} from 'lucide-react';

interface PlannerViewProps {
  subjects: Subject[];
  classes: ClassSchedule[];
  tasks: Task[];
  onAddClass: (
    subjectId: string,
    className: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    room?: string
  ) => void;
  onEditClass: (id: string, updated: Partial<ClassSchedule>) => void;
  onDeleteClass: (id: string) => void;
  onAddTask: (
    title: string,
    subjectId?: string,
    dueDate?: string,
    priority?: 'Low' | 'Medium' | 'High',
    type?: 'Assignment' | 'Exam' | 'Event' | 'StudySession' | 'Task'
  ) => void;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function PlannerView({ 
  subjects, 
  classes, 
  tasks, 
  onAddClass, 
  onEditClass, 
  onDeleteClass, 
  onAddTask, 
  onEditTask, 
  onDeleteTask 
}: PlannerViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addingTask, setAddingTask] = useState<string | null>(null); // 'Class', 'Task', etc.
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Create array of days for Month grid (padding previous/next)
  const days = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    return day > 0 && day <= daysInMonth ? new Date(year, month, day) : null;
  });

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  // Determine current week's dates
  const getWeekDates = () => {
    const currentDay = currentDate.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // start on Mon
    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentDate.getTime());
      d.setDate(currentDate.getDate() + mondayOffset + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates();

  // Get Activities for a specific Date
  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleString('default', { weekday: 'long' });

    const todaysClasses = classes.filter(c => c.dayOfWeek?.toLowerCase() === dayName?.toLowerCase());
    const todaysTasks = tasks.filter(t => t.dueDate === dateStr);

    return { classes: todaysClasses, tasks: todaysTasks };
  };

  const dayActivities = getActivitiesForDate(selectedDate);

  // HTML5 Drag and Drop event handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDay = (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const dateStr = targetDate.toISOString().split('T')[0];
    onEditTask(taskId, { dueDate: dateStr });
    
    // Trigger localized user visual notification
    setFeedbackMsg(`Task scheduled to ${targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}!`);
    setTimeout(() => setFeedbackMsg(''), 2500);
  };

  // List of pending / uncompleted tasks for dragpool list
  const pendingTasksPool = tasks.filter(t => !t.completed);

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto" id="planner_workspace">
      
      {/* Dynamic Drag feedback alert bar */}
      {feedbackMsg && (
        <div className="bg-indigo-600/90 text-white text-xs font-bold py-2.5 px-4 rounded-xl border border-indigo-400 shadow-xl animate-bounce text-center max-w-md mx-auto">
          ✨ {feedbackMsg}
        </div>
      )}

      {/* Header with Switch Controllers and Quickadd */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-indigo-400" />
            Digital Study Planner
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Drag-and-drop tasks directly onto any calendar cell to schedule them.</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Switch View Controllers */}
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => { setViewMode('month'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'month' ? 'bg-indigo-650/40 text-indigo-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => { setViewMode('week'); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'week' ? 'bg-indigo-650/40 text-indigo-200' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Week View
            </button>
          </div>

          <div className="relative shrink-0">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)} 
              className="py-1.5 px-4 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Schedule Item</span>
            </button>
            
            {showAddMenu && (
              <div className="absolute top-11 right-0 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-2 w-56 z-30 text-xs font-bold text-slate-300 animate-fade-in-down">
                {['Add Timetable Class', 'Add Assignment', 'Add Exam', 'Add Event', 'Add Study Session'].map(item => (
                  <button 
                    key={item} 
                    onClick={() => { setShowAddMenu(false); setAddingTask(item); }} 
                    className="block w-full text-left px-3 py-2.5 hover:bg-slate-800 rounded-lg cursor-pointer transition"
                  >
                    🚀 {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adding Class/Task Modal Form Overlay */}
      {addingTask && (
        <div className="p-5 bg-slate-900 border border-slate-750 rounded-2xl space-y-4 max-w-md mx-auto relative shadow-2xl animate-fade-in-down">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h2 className="text-sm font-extrabold text-white">{addingTask}</h2>
            <button onClick={() => setAddingTask(null)} className="text-slate-500 hover:text-slate-300 text-xs font-bold">Close</button>
          </div>
          
          <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const customDateStr = (formData.get('dueDate') as string) || selectedDate.toISOString().split('T')[0];

              if (addingTask === 'Add Timetable Class') {
                onAddClass(
                  formData.get('subjectId') as string, 
                  formData.get('className') as string || '',
                  formData.get('dayOfWeek') as string || selectedDate.toLocaleString('default', { weekday: 'long' }), 
                  formData.get('startTime') as string, 
                  formData.get('endTime') as string, 
                  formData.get('room') as string
                );
              } else {
                onAddTask(
                  formData.get('title') as string,
                  formData.get('subjectId') as string || undefined,
                  customDateStr,
                  (formData.get('priority') as 'Low' | 'Medium' | 'High') || 'Medium',
                  addingTask === 'Add Assignment' ? 'Assignment' : addingTask === 'Add Exam' ? 'Exam' : addingTask === 'Add Event' ? 'Event' : 'StudySession'
                );
              }
              setAddingTask(null);
          }} className="space-y-3.5 text-xs">
            {addingTask !== 'Add Timetable Class' && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Title *</label>
                <input name="title" placeholder="Homework / test topic review..." className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-205 focus:outline-none focus:border-indigo-500" required />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Associated Course</label>
                <select name="subjectId" className="w-full bg-slate-950 p-2.5 rounded-lg text-slate-200 border border-slate-800 focus:outline-none" required>
                  <option value="">Select Course</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {addingTask === 'Add Timetable Class' ? (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Day of Week</label>
                  <select name="dayOfWeek" defaultValue={selectedDate.toLocaleString('default', { weekday: 'long' })} className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Due Date</label>
                  <input type="date" name="dueDate" defaultValue={selectedDate.toISOString().split('T')[0]} className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none" required />
                </div>
              )}
            </div>

            {addingTask === 'Add Timetable Class' && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Class Code / Custom Name</label>
                <input name="className" placeholder="e.g. Physics 101 Lecture" className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Start Hour</label>
                <input type="time" name="startTime" defaultValue="09:00" className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">End Hour</label>
                <input type="time" name="endTime" defaultValue="10:30" className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none" required />
              </div>
            </div>

            {addingTask === 'Add Timetable Class' ? (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Room / Zoom link</label>
                <input name="room" placeholder="e.g. Hall 4B, Room 10" className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none" />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Task Priority</label>
                <select name="priority" className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-200 focus:outline-none">
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            )}

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button type="submit" className="flex-1 bg-indigo-650 hover:bg-indigo-650 text-white font-bold py-2 rounded-xl cursor-pointer transition">Save Activity</button>
              <button type="button" onClick={() => setAddingTask(null)} className="px-4 bg-slate-850 hover:bg-slate-800 text-slate-400 font-bold rounded-xl cursor-pointer transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN TWO-PANEL INTERFACE WITH SIDE DRAGPOOL LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL A: CALENDAR AND DAILY SCHEDULER (Size span 9) */}
        <div className="lg:col-span-9 space-y-6" id="planner_board_panel">
          
          {/* Calendar Widget Card */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl shadow-xl">
            {/* Nav controls */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white cursor-pointer transition">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-black text-white uppercase tracking-wider min-w-[120px] text-center">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={() => changeMonth(1)} className="p-2 bg-slate-950 hover:bg-slate-850 rounded-xl text-slate-400 hover:text-white cursor-pointer transition">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex gap-1">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-850">
                  {viewMode === 'month' ? 'Monthly Calendar' : 'Weekly Scheduler Strip'}
                </span>
              </div>
            </div>

            {/* MONTH VIEW GRID */}
            {viewMode === 'month' && (
              <div id="month_view_surface">
                {/* Weekdays */}
                <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-3">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-1">{day}</div>)}
                </div>
                
                {/* Day Grid cells with HTML5 drop listener */}
                <div className="grid grid-cols-7 gap-1.5 text-xs text-slate-300">
                  {days.map((date, i) => {
                    if (!date) {
                      return <div key={`empty-${i}`} className="bg-transparent aspect-square" />;
                    }

                    const isSelected = isSameDay(date, selectedDate);
                    const isToday = isSameDay(date, new Date());
                    const acts = getActivitiesForDate(date);
                    const totalActs = acts.classes.length + acts.tasks.length;
                    const dateStr = date.toISOString().split('T')[0];

                    return (
                      <div
                        key={dateStr}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnDay(e, date)}
                        onClick={() => setSelectedDate(date)}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1.5 cursor-pointer relative transition-all ${
                          isSelected
                            ? 'bg-indigo-650/15 border-indigo-500/50 text-white shadow-inner shadow-indigo-500/10'
                            : isToday
                            ? 'bg-slate-950/40 border-indigo-500/20 text-indigo-300 hover:bg-slate-850'
                            : 'bg-slate-950/20 border-slate-850 hover:bg-slate-850 hover:border-slate-800'
                        }`}
                      >
                        {/* Day Number */}
                        <span className={`text-[10px] font-black pointer-events-none self-start ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                          {date.getDate()}
                        </span>

                        {/* Bullet indicators for classes/tasks */}
                        {totalActs > 0 && (
                          <div className="flex gap-1 flex-wrap self-end justify-center w-full max-h-[16px] overflow-hidden pointer-events-none">
                            {acts.classes.map(c => {
                              const sub = subjects.find(s => s.id === c.subjectId);
                              return (
                                <span 
                                  key={c.id} 
                                  className="w-1.5 h-1.5 rounded-full" 
                                  style={{ backgroundColor: sub ? sub.color : '#6366f1' }}
                                  title="Class scheduled"
                                />
                              );
                            })}
                            {acts.tasks.map(t => {
                              const sub = subjects.find(s => s.id === t.subjectId);
                              return (
                                <span 
                                  key={t.id} 
                                  className="w-1.5 h-1.5 rounded-sm" 
                                  style={{ backgroundColor: sub ? sub.color : '#e11d48' }}
                                  title={`Task: ${t.title}`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW STRIP */}
            {viewMode === 'week' && (
              <div id="week_view_surface" className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weekDates.map((date, i) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleString('default', { weekday: 'short' });
                  const isSelected = isSameDay(date, selectedDate);
                  const isToday = isSameDay(date, new Date());
                  const acts = getActivitiesForDate(date);

                  return (
                    <div
                      key={dateStr}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnDay(e, date)}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-2xl border cursor-pointer min-h-[160px] flex flex-col justify-between transition ${
                        isSelected
                          ? 'bg-indigo-650/15 border-indigo-500/40'
                          : isToday
                          ? 'bg-slate-950/45 border-indigo-500/20 text-indigo-400'
                          : 'bg-slate-950/20 border-slate-850 hover:bg-slate-950/40'
                      }`}
                    >
                      <div className="border-b border-slate-850 pb-1.5">
                        <span className="text-[10px] font-black block uppercase tracking-wider text-slate-500">{dayName}</span>
                        <span className={`text-base font-black ${isToday ? 'text-indigo-400' : 'text-slate-300'}`}>{date.getDate()}</span>
                      </div>

                      <div className="flex-1 py-2 space-y-1 overflow-y-auto max-h-[100px]" id={`week_view_cell_list_${dateStr}`}>
                        {acts.classes.map(c => {
                          const sub = subjects.find(s => s.id === c.subjectId);
                          return (
                            <div key={c.id} className="text-[8px] font-bold py-0.5 px-1 bg-slate-900 border border-slate-800 rounded text-slate-300 truncate" title={`${c.className || sub?.name}`}>
                              ⌚ {c.className || sub?.name}
                            </div>
                          );
                        })}
                        {acts.tasks.map(t => (
                          <div key={t.id} className="text-[8px] font-bold py-0.5 px-1 bg-indigo-950/30 border border-indigo-900/30 rounded text-indigo-300 truncate" title={t.title}>
                            📋 {t.title}
                          </div>
                        ))}
                      </div>

                      <span className="text-[8px] text-slate-600 block text-right mt-1 font-bold">
                        {acts.classes.length + acts.tasks.length} items
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Daily Schedule Activities panel */}
          <div className="bg-slate-900 border border-slate-800/85 p-5 rounded-3xl shadow-xl">
            <h2 className="text-sm font-extrabold text-white border-b border-slate-850 pb-3 mb-4">
              📅 Activities on {selectedDate.toDateString()}
            </h2>

            {dayActivities.classes.length === 0 && dayActivities.tasks.length === 0 ? (
              <div className="p-8 bg-slate-950/35 rounded-2xl border border-dashed border-slate-850 text-center">
                <p className="text-xs text-slate-500">No school lectures, tasks, or study events scheduled for this day.</p>
                <button
                  onClick={() => setAddingTask('Add Assignment')}
                  className="mt-3 py-1.5 px-4 bg-indigo-650/15 text-indigo-400 hover:bg-indigo-650/30 text-[11px] font-bold border border-indigo-600/10 rounded-lg cursor-pointer transition"
                >
                  Schedule Something
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Classes Section */}
                {dayActivities.classes.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scheduled Courses & Classes</h3>
                    {dayActivities.classes.map(cls => {
                      const sub = subjects.find(s => s.id === cls.subjectId);
                      return (
                        <div key={cls.id} className="p-3 bg-slate-950/20 rounded-xl border border-slate-850 flex justify-between items-center group hover:bg-slate-950/55 hover:border-slate-800 transition">
                          <div>
                            <p className="text-xs font-bold text-white">{cls.className || sub?.name}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1"><Clock className="h-3 w-3" /> {cls.startTime} - {cls.endTime} {cls.room && `• Room ${cls.room}`}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sub?.color || '#3b82f6'}15`, color: sub?.color || '#3b82f6' }}>
                              {sub?.name || 'Class'}
                            </span>
                            <button 
                              onClick={() => onDeleteClass(cls.id)}
                              className="p-1 text-slate-600 hover:text-rose-400 transition cursor-pointer"
                              title="Delete timetable item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tasks Section */}
                {dayActivities.tasks.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-505">Study Tasks & Assignments</h3>
                    {dayActivities.tasks.map(task => {
                      const sub = subjects.find(s => s.id === task.subjectId);
                      return (
                        <div 
                          key={task.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className="p-3 bg-slate-950/20 rounded-xl border border-slate-850 flex justify-between items-center group hover:bg-slate-950/55 hover:border-slate-800 transition shadow cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-slate-600 grab-handle" />
                            <div>
                              <p className={`text-xs font-bold ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>{task.title}</p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {task.startTime && `${task.startTime} - `}
                                {task.endTime && `${task.endTime} `}
                                {task.location && ` at ${task.location}`}
                                <span className={`ml-1.5 font-bold px-1.5 py-0.2 rounded text-[8px] uppercase ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-900 border border-slate-800 text-slate-400'}`}>
                                  {task.priority}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${task.type === 'Exam' ? 'bg-rose-600/10 text-rose-400' : 'bg-indigo-600/10 text-indigo-400'}`}>
                              {task.type}
                            </span>
                            <button 
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-slate-600 hover:text-rose-450 cursor-pointer transition"
                              title="Delete task item"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PANEL B: DRAGPOOL - UNSCHEDULED / PENDING TASKS POOL (Size span 3) */}
        <div className="lg:col-span-3 space-y-4" id="drag_pool_panel">
          <div className="bg-slate-900 border border-slate-800/85 p-4 rounded-3xl flex flex-col h-[calc(100vh-16rem)] min-h-[400px]">
            <div className="pb-3 border-b border-slate-850 shrink-0">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="h-4 w-4 text-pink-400" />
                Task Inbox Pool
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">Drag items onto calendar days to quickly schedule them.</p>
            </div>

            {/* Task Pool List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1" id="pending_task_dragpool_body">
              {pendingTasksPool.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center p-3">
                  <CheckCircle2 className="h-8 w-8 text-indigo-400 mb-2 opacity-50" />
                  <p className="text-[10px] text-slate-500 font-bold leading-normal">Pool is clear!</p>
                  <p className="text-[8px] text-slate-600 leading-normal mt-0.5">All tasks are successfully scheduled or resolved.</p>
                </div>
              ) : (
                pendingTasksPool.map(task => {
                  const sub = subjects.find(s => s.id === task.subjectId);
                  const subColor = sub ? sub.color : '#4f46e5';

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="p-3 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700/80 cursor-grab active:cursor-grabbing transition-all select-none relative overflow-hidden group shadow-md"
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-xs text-slate-205 leading-snug group-hover:text-white truncate block flex-1">
                          {task.title}
                        </span>
                        <GripVertical className="h-3 w-3 text-slate-600/80 mt-0.5 shrink-0" />
                      </div>

                      <div className="flex items-center justify-between w-full pt-2 mt-1 border-t border-slate-900">
                        <div className="flex items-center gap-1 truncate max-w-[80px]">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: subColor }} />
                          <span className="text-[8px] font-bold text-slate-500 truncate">{sub ? sub.name : 'General'}</span>
                        </div>

                        <span className="text-[8px] text-slate-400 font-bold px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                          {task.dueDate || 'Unscheduled'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button 
              onClick={() => setAddingTask('Add Assignment')}
              className="w-full text-center py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-extrabold text-indigo-400 rounded-xl cursor-pointer transition shrink-0"
            >
              + QUICK INTAKE TASK
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
