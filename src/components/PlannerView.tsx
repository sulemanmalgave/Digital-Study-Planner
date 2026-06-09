import React, { useState } from 'react';
import { Subject, ClassSchedule, Task } from '../types';
import { Clock, Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Layers, Target } from 'lucide-react';

interface PlannerViewProps {
  subjects: Subject[];
  classes: ClassSchedule[];
  tasks: Task[];
  onAddClass: (cls: Omit<ClassSchedule, 'id'>) => void;
  onEditClass: (cls: ClassSchedule) => void;
  onDeleteClass: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export default function PlannerView({ subjects, classes, tasks, onAddClass, onEditClass, onDeleteClass, onAddTask, onEditTask, onDeleteTask }: PlannerViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addingTask, setAddingTask] = useState<string | null>(null); // 'Class', 'Task', etc.

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

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

  // Activity Filtering
  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleString('default', { weekday: 'long' });

    const todaysClasses = classes.filter(c => c.dayOfWeek?.toLowerCase() === dayName?.toLowerCase());
    const todaysTasks = tasks.filter(t => t.dueDate === dateStr);

    return { classes: todaysClasses, tasks: todaysTasks };
  };

  const dayActivities = getActivitiesForDate(selectedDate);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 px-4 lg:grid lg:grid-cols-12 lg:gap-x-12" id="planner_tab">
      
      {/* Container for Calendar */}
      <div className="lg:col-span-5 flex justify-center">
        <div className="w-full max-w-md space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center py-2 relative">
          <h1 className="text-2xl font-bold text-white tracking-tight">Planner</h1>
          <button onClick={() => setShowAddMenu(!showAddMenu)} className="text-indigo-400 hover:text-indigo-300 p-2">
            <Plus className="h-6 w-6" />
          </button>
          
          {showAddMenu && (
            <div className="absolute top-12 right-0 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-2 w-56 z-20 text-sm font-semibold text-slate-300">
              {['Add Timetable Class', 'Add Assignment', 'Add Exam', 'Add Event', 'Add Study Session'].map(item => (
                <button key={item} onClick={() => {setShowAddMenu(false); setAddingTask(item)}} className="block w-full text-left px-3 py-2 hover:bg-slate-800 rounded">
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {addingTask && (
          <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (addingTask === 'Add Timetable Class') {
                onAddClass({ 
                    subjectId: formData.get('subjectId') as string, 
                    dayOfWeek: formData.get('dayOfWeek') as string || selectedDate.toLocaleString('default', { weekday: 'long' }), 
                    startTime: formData.get('startTime') as string, 
                    endTime: formData.get('endTime') as string, 
                    room: formData.get('room') as string, 
                    className: formData.get('className') as string 
                });
              } else {
                onAddTask({
                    title: formData.get('title') as string,
                    subjectId: formData.get('subjectId') as string,
                    dueDate: formData.get('dueDate') as string || selectedDate.toISOString().split('T')[0],
                    type: addingTask === 'Add Assignment' ? 'Assignment' : addingTask === 'Add Exam' ? 'Exam' : addingTask === 'Add Event' ? 'Event' : 'StudySession',
                    startTime: formData.get('startTime') as string,
                    endTime: formData.get('endTime') as string,
                    location: formData.get('location') as string,
                    priority: 'Medium',
                    completed: false
                });
              }
              setAddingTask(null);
          }} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 z-20 relative">
            <h2 className="text-sm font-bold text-white">{addingTask}</h2>
            {addingTask !== 'Add Timetable Class' && <input name="title" placeholder="Title" className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800" required />}
            <select name="subjectId" className="w-full bg-slate-950 p-2 rounded text-xs text-slate-200 border border-slate-800" required>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {addingTask === 'Add Timetable Class' && <input name="className" placeholder="Class Name (Optional)" className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800" />}
            {addingTask === 'Add Timetable Class' && <select name="dayOfWeek" className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => <option key={d} value={d}>{d}</option>)}</select>}
            
            <div className="grid grid-cols-2 gap-2">
                <input type="time" name="startTime" className="bg-slate-950 p-2 rounded text-xs border border-slate-800" required />
                <input type="time" name="endTime" className="bg-slate-950 p-2 rounded text-xs border border-slate-800" required />
            </div>
            {addingTask === 'Add Timetable Class' && <input name="room" placeholder="Room/Location (Optional)" className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800" />}

             <button type="submit" className="w-full bg-indigo-600 text-white rounded p-2 text-xs font-semibold">Save</button>
             <button type="button" onClick={() => setAddingTask(null)} className="w-full bg-slate-800 text-white rounded p-2 text-xs">Cancel</button>
          </form>
        )}

        {/* Calendar */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-white"><ChevronLeft /></button>
            <h2 className="text-md font-semibold text-white">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => changeMonth(1)} className="text-slate-400 hover:text-white"><ChevronRight /></button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500 mb-2 mt-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-1">{day}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-sm text-slate-300">
            {days.map((date, i) => (
              <button 
                key={i} 
                onClick={() => date && setSelectedDate(date)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg transition-all relative ${
                  date ? 'hover:bg-slate-800' : ''
                } ${date && isSameDay(date, selectedDate) ? 'bg-indigo-600 text-white' : ''}`}
              >
                <span className={date && isSameDay(date, selectedDate) ? 'text-white' : 'text-slate-300'}>
                    {date?.getDate()}
                </span>
                {date && (getActivitiesForDate(date).classes.length > 0 || getActivitiesForDate(date).tasks.length > 0) &&                
                  <span className="mt-1 w-1 h-1 bg-indigo-400 rounded-full" />
                }
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
      
      {/* Container for Activities */}
      <section className="lg:col-span-7 space-y-4 pt-4 lg:pt-0">
        <h2 className="text-lg font-semibold text-white">{selectedDate.toDateString()}</h2>
        
        {dayActivities.classes.length === 0 && dayActivities.tasks.length === 0 ? (
          <div className="p-6 bg-slate-900/20 rounded-xl border border-dashed border-slate-800 text-center">
            <p className="text-sm text-slate-400">No activities scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayActivities.classes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">Timetable</h3>
                {dayActivities.classes.map(cls => {
                    const subject = subjects.find(s => s.id === cls.subjectId);
                    return (
                      <div key={cls.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-white">{cls.className || subject?.name}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {cls.startTime} - {cls.endTime}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded">{subject?.name}</span>
                      </div>
                    )
                })}
              </div>
            )}
            
            {dayActivities.tasks.length > 0 && (
              <div className="space-y-4">
                {['Assignment', 'Exam', 'Event', 'StudySession'].map(type => {
                    const filteredTasks = dayActivities.tasks.filter(t => t.type === type);
                    if (filteredTasks.length === 0) return null;
                    return (
                        <div key={type} className="space-y-2">
                            <h3 className="text-xs text-slate-500 font-bold uppercase tracking-wider">{type}s</h3>
                            {filteredTasks.map(task => (
                              <div key={task.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-white">{task.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {task.startTime && `${task.startTime} - `}
                                        {task.endTime && `${task.endTime}`}
                                        {task.location && ` at ${task.location}`}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${task.type === 'Exam' ? 'bg-rose-600/20 text-rose-400' : 'bg-indigo-600/20 text-indigo-400'}`}>
                                    {task.type}
                                </span>
                              </div>
                            ))}
                        </div>
                    )
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
