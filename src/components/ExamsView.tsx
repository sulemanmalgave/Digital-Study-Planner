import React, { useState } from 'react';
import { Subject, Task } from '../types';
import { 
  Calendar, AlertTriangle, Plus, Trash2, Award, Clock, Sparkles, 
  Bell, HelpCircle, CheckCircle, ChevronRight
} from 'lucide-react';

interface ExamsViewProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (
    title: string,
    subjectId?: string,
    dueDate?: string,
    priority?: 'Low' | 'Medium' | 'High',
    type?: 'Assignment' | 'Exam' | 'Event' | 'StudySession' | 'Task',
    startTime?: string,
    endTime?: string,
    location?: string
  ) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

export default function ExamsView({
  tasks,
  subjects,
  onAddTask,
  onDeleteTask,
  onToggleTask,
}: ExamsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [errorMsg, setErrorMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks to only include Exams
  const exams = tasks.filter(t => t.type === 'Exam');
  const pendingExams = exams.filter(t => !t.completed);
  const completedExams = exams.filter(t => t.completed);

  // Countdown Helper
  const getCountdown = (dueDateStr: string) => {
    const today = new Date(todayStr + 'T12:00:00');
    const examDate = new Date(dueDateStr + 'T12:00:00');
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'TODAY', classes: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
    if (diffDays < 0) return { label: 'COMPLETED / OVERDUE', classes: 'bg-slate-900 border border-slate-800 text-slate-500' };
    if (diffDays === 1) return { label: 'In 1 Day!', classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/20 animate-pulse' };
    return { label: `In ${diffDays} Days`, classes: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !dueDate) {
      setErrorMsg('Please complete all mandatory fields');
      return;
    }
    
    onAddTask(
      title.trim(),
      subjectId,
      dueDate,
      priority,
      'Exam',
      startTime,
      undefined,
      location.trim() || undefined
    );

    setTitle('');
    setSubjectId('');
    setDueDate('');
    setLocation('');
    setErrorMsg('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto text-left" id="exams_workspace_container">
      
      {/* Header compact block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900/60 rounded-2xl border border-slate-850 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-rose-455 animate-pulse" />
            Academic Exam Hub
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Control dynamic count downs, record grades, and monitor preparation schedules in desktop grids.</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-550 text-white font-bold text-xs py-1.5 px-4 rounded-xl cursor-pointer shadow-md transition shrink-0"
        >
          <Plus className="h-4 w-4" /> Add Exam Paper
        </button>
      </div>

      {/* Pop out add Exam Form panel */}
      {showAddForm && (
        <form onSubmit={handleCreateExam} className="bg-slate-900 border border-slate-755 p-4 rounded-2xl space-y-4 shadow-2xl animate-fade-in-down max-w-lg mx-auto">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-xs font-black text-rose-400 uppercase tracking-widest block">
              Schedule New Exam Paper
            </span>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-slate-300 text-xs font-bold">Cancel</button>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Exam Title / Course Topic *</label>
              <input
                type="text"
                required
                placeholder="e.g. Calculus Midterm Examination"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-205 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Associated Course *</label>
                <select
                  required
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="">Choose Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Date of Exam *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Exam Hall Room / Location</label>
                <input
                  type="text"
                  placeholder="e.g. building B floor 3"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Priority Weights</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none"
              >
                <option value="High">Critical Review / High Weight</option>
                <option value="Medium">Medium Weight</option>
                <option value="Low">Low Weight / Essay</option>
              </select>
            </div>

            {errorMsg && <p className="text-rose-400 font-bold">{errorMsg}</p>}

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button type="submit" className="flex-1 py-2 bg-rose-650 hover:bg-rose-600 text-white font-extrabold rounded-xl cursor-pointer transition">
                Create Exam Paper
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 bg-slate-850 hover:bg-slate-800 rounded-xl text-slate-400 font-bold cursor-pointer transition">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* EXAMS CARDS GRID (Aesthetic Desktop layout) */}
      <div className="space-y-4" id="exams_active_grid_section">
        <h2 className="text-xs font-black uppercase text-slate-505 tracking-widest block border-b border-slate-850 pb-2">
          🔥 Pending Exams ({pendingExams.length})
        </h2>

        {pendingExams.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl">
            <span className="p-3 bg-slate-950 rounded-full text-emerald-400 inline-block mb-3 border border-slate-850">
              <CheckCircle className="h-6 w-6" />
            </span>
            <p className="text-slate-400 text-xs font-bold font-sans">No upcoming exams or test papers found!</p>
            <p className="text-[10px] text-slate-500 mt-1">Excellent job keeping up with current prep workloads.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="exams_desktop_grid">
            {pendingExams.map(exam => {
              const sub = subjects.find(s => s.id === exam.subjectId);
              const cntDetails = getCountdown(exam.dueDate);

              return (
                <div 
                  key={exam.id}
                  className="bg-slate-900 border border-slate-850 rounded-3xl p-5 hover:border-slate-700 hover:bg-slate-902/50 transition duration-200 relative overflow-hidden flex flex-col justify-between h-48 group shadow"
                >
                  {/* Left colored border accent strip */}
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: sub?.color || '#ec4899' }} />

                  <div className="space-y-2 pl-2">
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${cntDetails.classes}`}>
                        {cntDetails.label}
                      </span>

                      <button 
                        onClick={() => onDeleteTask(exam.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-650 hover:text-rose-405 hover:bg-slate-950 rounded transition cursor-pointer"
                        title="Delete exam"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h3 className="font-sans text-sm font-black text-white line-clamp-2 leading-snug">
                      {exam.title}
                    </h3>
                  </div>

                  <div className="pl-2 border-t border-slate-850 pt-3 flex flex-col gap-1.5 text-[10px] text-slate-400 font-bold/80">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Course Subject</span>
                      <span className="text-white font-extrabold">{sub ? sub.name : 'General'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Date/Time</span>
                      <span className="text-slate-350">{exam.dueDate} at {exam.startTime || '09:00'}</span>
                    </div>

                    {exam.location && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Hall Room</span>
                        <span className="text-slate-300 truncate max-w-[120px]">{exam.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COMPLETED EXAMS ARCHIVES */}
      {completedExams.length > 0 && (
        <div className="pt-4" id="exams_completed_grid_section">
          <h2 className="text-xs font-black uppercase text-slate-505 tracking-widest block border-b border-slate-850 pb-2 mb-4">
            🎓 Resolved/Archived Test Papers ({completedExams.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {completedExams.map(exam => {
              const sub = subjects.find(s => s.id === exam.subjectId);
              return (
                <div 
                  key={exam.id}
                  className="bg-slate-900/30 border border-slate-900 opacity-55 rounded-3xl p-4 flex flex-col justify-between h-36"
                >
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="text-xs font-bold text-slate-400 line-clamp-1 leading-normal">
                      {exam.title}
                    </h3>
                    <CheckCircle className="h-4 w-4 text-emerald-505 shrink-0" />
                  </div>

                  <div className="border-t border-slate-900 pt-2 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                    <span>{sub ? sub.name : 'General'}</span>
                    <span>Resolved {exam.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
