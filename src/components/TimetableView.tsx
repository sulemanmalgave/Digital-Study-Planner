import React, { useState } from 'react';
import { Subject, ClassSchedule } from '../types';
import { Clock, Plus, Edit2, Trash2, Copy, MoreVertical, MapPin } from 'lucide-react';

interface TimetableViewProps {
  subjects: Subject[];
  classes: ClassSchedule[];
  onAddClass: (cls: Omit<ClassSchedule, 'id'>) => void;
  onEditClass: (cls: ClassSchedule) => void;
  onDeleteClass: (id: string) => void;
}

export default function TimetableView({ subjects, classes, onAddClass, onEditClass, onDeleteClass }: TimetableViewProps) {
  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const getSubjectIcon = (name: string) => {
    if (name.includes('Math')) return '🔢';
    if (name.includes('Physics')) return '⚛️';
    if (name.includes('Chemistry')) return '🧪';
    return '📚';
  };

  const [editingClass, setEditingClass] = useState<ClassSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subjectId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', room: '', className: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const resetForm = () => {
    setFormData({ subjectId: '', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', room: '', className: '' });
    setEditingClass(null);
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subjectId) {
      alert('Please select a subject');
      return;
    }
    
    if (formData.startTime >= formData.endTime) {
      alert('End Time must be after Start Time');
      return;
    }

    const duplicate = classes.find(c => 
      c.dayOfWeek === formData.dayOfWeek && 
      c.startTime === formData.startTime && 
      c.id !== editingClass?.id
    );
    if(duplicate) {
      alert('Class already exists at this time');
      return;
    }

    if(editingClass) {
      onEditClass({ ...editingClass, ...formData });
      setSuccessMsg('Timetable updated successfully');
    } else {
      onAddClass(formData);
      setSuccessMsg('Timetable saved successfully');
    }
    resetForm();
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleEdit = (cls: ClassSchedule) => {
    setEditingClass(cls);
    setFormData({ subjectId: cls.subjectId, dayOfWeek: cls.dayOfWeek || 'Monday', startTime: cls.startTime, endTime: cls.endTime, room: cls.room || '', className: cls.className || '' });
    setShowForm(true);
  };

  const handleCopy = (cls: ClassSchedule) => {
    onAddClass({ subjectId: cls.subjectId, dayOfWeek: cls.dayOfWeek || 'Monday', startTime: cls.startTime, endTime: cls.endTime, room: cls.room || '', className: cls.className || '' });
    setSuccessMsg('Timetable copied');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleDelete = (id: string) => {
    if(confirm('Delete this timetable entry?')) {
        onDeleteClass(id);
        setSuccessMsg('Timetable deleted');
        setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const isClassActive = (startTime: string, endTime: string) => {
    const now = new Date();
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const start = new Date(); start.setHours(startH, startM, 0, 0);
    const end = new Date(); end.setHours(endH, endM, 0, 0);
    return now >= start && now <= end;
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-24 px-2" id="timetable_tab">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-2xl font-bold text-white tracking-tight">Timetable</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-semibold text-white hover:bg-indigo-500">
           <Plus className="h-3 w-3" /> Set Timetable
        </button>
      </div>

      {successMsg && <div className="p-2 bg-emerald-900/20 text-emerald-400 text-xs rounded text-center">{successMsg}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3">
          <h2 className="text-sm font-bold text-white">{editingClass ? 'Edit' : 'Add'} Class</h2>
          <select value={formData.subjectId} onChange={e => setFormData({...formData, subjectId: e.target.value})} className="w-full bg-slate-950 p-2 rounded text-xs text-slate-200 border border-slate-800" required>
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="text" placeholder="Class Name (Optional)" value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})} className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800" />
          <select value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800">
            {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="bg-slate-950 p-2 rounded text-xs border border-slate-800" required />
            <input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="bg-slate-950 p-2 rounded text-xs border border-slate-800" required />
          </div>
          <input type="text" placeholder="Room/Location (Optional)" value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} className="w-full bg-slate-950 p-2 rounded text-xs border border-slate-800" />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white rounded p-2 text-xs font-semibold">Save</button>
            <button type="button" onClick={resetForm} className="flex-1 bg-slate-800 text-white rounded p-2 text-xs">Cancel</button>
          </div>
        </form>
      )}
      
      <div className="space-y-4">
        {classes.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 px-4 text-center">
            <p className="text-slate-400">No timetable created yet</p>
            <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-500 cursor-pointer">Set Timetable</button>
          </div>
        ) : (
          DAYS_OF_WEEK.map(dayName => {
            const dayClasses = classes.filter(c => c.dayOfWeek?.toLowerCase() === dayName?.toLowerCase())
              .sort((a,b) => a.startTime.localeCompare(b.startTime));
            
            if (dayClasses.length === 0) return null;

            return (
              <div key={dayName} className="space-y-2">
                <h3 className="font-bold text-slate-500 text-xs uppercase tracking-wider">{dayName}</h3>
                <div className="space-y-2">
                  {dayClasses.map(cls => {
                    const subject = subjects.find(s => s.id === cls.subjectId);
                    const isActive = isClassActive(cls.startTime, cls.endTime);
                    
                    return (
                      <div key={cls.id} className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 relative overflow-hidden"
                           style={{ borderLeft: `4px solid ${subject?.color || '#64748b'}` }}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getSubjectIcon(subject?.name || '')}</span>
                            <p className="text-sm font-semibold text-white">{cls.className || subject?.name}</p>
                            {isActive && <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Now</span>}
                          </div>
                          <div className="flex items-center gap-1">
                              <button onClick={() => handleEdit(cls)} className="p-1 text-slate-500 hover:text-white"><Edit2 className="h-3 w-3" /></button>
                              <button onClick={() => handleCopy(cls)} className="p-1 text-slate-500 hover:text-white"><Copy className="h-3 w-3" /></button>
                              <button onClick={() => handleDelete(cls.id)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {cls.startTime} - {cls.endTime}</span>
                          {cls.room && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cls.room}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
