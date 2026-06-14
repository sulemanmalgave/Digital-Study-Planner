import React, { useState } from 'react';
import { Subject, Task } from '../types';
import { 
  CheckSquare, Calendar, Plus, Trash2, Edit2, Check, X, Filter, 
  Search, Clock, AlertCircle, Sparkles, CheckCircle2, ChevronDown, ChevronUp, ArrowUpDown
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  subjects: Subject[];
  profile: any;
  onAddTask: (title: string, subjectId: string, dueDate: string, priority: 'Low' | 'Medium' | 'High') => boolean;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

type TabType = 'All' | 'Today' | 'Upcoming' | 'Completed';

export default function TasksView({
  tasks,
  subjects,
  profile,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
}: TasksViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  
  // Table Sorting logic states
  const [sortField, setSortField] = useState<'title' | 'subjectId' | 'dueDate' | 'priority' | 'status'>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Add task form states
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [formError, setFormError] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    if (profile.planType === 'Free' && tasks.length >= 50) {
      setFormError('Free tier limit of 50 tasks has been reached. Please upgrade in Settings!');
      return;
    }

    const ok = onAddTask(title.trim(), subjectId, dueDate, priority);
    if (ok) {
      setTitle('');
      setSubjectId('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('Medium');
      setFormError('');
      setShowAddSection(false);
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditSubjectId(task.subjectId || '');
    setEditDueDate(task.dueDate);
    setEditPriority(task.priority);
  };

  const saveEdit = (id: string) => {
    onEditTask(id, {
      title: editTitle.trim(),
      subjectId: editSubjectId || undefined,
      dueDate: editDueDate,
      priority: editPriority,
    });
    setEditingTaskId(null);
  };

  const handleSort = (field: 'title' | 'subjectId' | 'dueDate' | 'priority' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Perform task filtering and custom table sorting
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = String(task.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Today') {
        matchesTab = task.dueDate === todayStr && !task.completed;
      } else if (activeTab === 'Upcoming') {
        matchesTab = task.dueDate > todayStr && !task.completed;
      } else if (activeTab === 'Completed') {
        matchesTab = task.completed;
      }

      const matchesSubject = filterSubject === 'All' || task.subjectId === filterSubject;
      const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;

      return matchesSearch && matchesTab && matchesSubject && matchesPriority;
    })
    .sort((a, b) => {
      let comparison = 0;

      if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '');
      } else if (sortField === 'subjectId') {
        const subA = subjects.find(s => s.id === a.subjectId)?.name || '';
        const subB = subjects.find(s => s.id === b.subjectId)?.name || '';
        comparison = subA.localeCompare(subB);
      } else if (sortField === 'dueDate') {
        comparison = (a.dueDate || '').localeCompare(b.dueDate || '');
      } else if (sortField === 'priority') {
        const prWeights = { High: 3, Medium: 2, Low: 1 };
        comparison = prWeights[a.priority] - prWeights[b.priority];
      } else if (sortField === 'status') {
        comparison = (a.completed ? 1 : 0) - (b.completed ? 1 : 0);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto text-left" id="tasks_workspace_page">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-900/60 rounded-2xl border border-slate-850 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-400" />
            Checklist & Assignments
          </h1>
          <p className="text-slate-400 text-xs mt-0.5">Filter, sort, register study topics, or check current completions on a table view grid.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-950 font-bold px-3 py-1.5 border border-slate-850 text-slate-350 rounded-xl block shrink-0">
            Pending Tasks: <span className="text-indigo-400 font-extrabold">{pendingCount}</span>
          </span>
          <button
            onClick={() => setShowAddSection(!showAddSection)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-md cursor-pointer transition shrink-0"
            id="btn_toggle_add_task"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Add Task Panel */}
      {showAddSection && (
        <form onSubmit={handleCreateTask} className="bg-slate-900 border border-slate-750 p-4 rounded-2xl space-y-4 shadow-2xl animate-fade-in-down" id="add_task_form_workspace">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Create New Student Task Item
            </span>
            <button 
              type="button" 
              onClick={() => { setShowAddSection(false); setFormError(''); }} 
              className="text-slate-500 hover:text-slate-200 text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1.5">Assignment Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Read Physics Chapter 3 summary"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-650"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1.5">Academic Subject</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">-- No Course --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-455 font-bold uppercase block mb-1.5">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-450 font-bold uppercase block mb-1.5">Priority</label>
              <div className="grid grid-cols-3 gap-1">
                {(['Low', 'Medium', 'High'] as const).map(pr => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setPriority(pr)}
                    className={`py-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      priority === pr
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-955/40 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-455 bg-rose-955/20 p-2.5 rounded-lg border border-rose-900/40">{formError}</p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-850 pt-3">
            <button
              type="submit"
              className="bg-indigo-650 hover:bg-indigo-575 text-white font-bold text-xs py-2 px-5 rounded-xl transition cursor-pointer"
            >
              Add Row Item
            </button>
          </div>
        </form>
      )}

      {/* FILTERS PANEL BAR */}
      <div className="bg-slate-900/20 border border-slate-850 p-3 rounded-2xl flex flex-flex flex-col md:flex-row gap-3 justify-between items-center" id="tasks_filters_row">
        
        {/* Navigation Tabs (All, Today, Upcoming, Completed) */}
        <div className="flex gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-850/60 w-full md:w-auto overflow-x-auto shrink-0">
          {(['All', 'Today', 'Upcoming', 'Completed'] as TabType[]).map(tab => {
            const count = tasks.filter(t => {
              if (tab === 'Today') return t.dueDate === todayStr && !t.completed;
              if (tab === 'Upcoming') return t.dueDate > todayStr && !t.completed;
              if (tab === 'Completed') return t.completed;
              return !t.completed;
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all tracking-wide shrink-0 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-indigo-650/40 text-indigo-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab} <span className="ml-1 text-[10px] font-black px-1.5 rounded bg-slate-900 text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search, course matchers, priority dropdown controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative w-full max-w-[160px] sm:max-w-none">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search assignment titles..."
              className="w-full bg-slate-950 border border-slate-805 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="bg-slate-950 border border-slate-805 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-400 focus:outline-none cursor-pointer"
          >
            <option value="All">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-955 border border-slate-805 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-400 focus:outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">🔥 High</option>
            <option value="Medium">⚡ Medium</option>
            <option value="Low">💤 Low</option>
          </select>
        </div>
      </div>

      {/* FILTER RESETS ALERT */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl">
          <p className="text-slate-500 text-xs">No active study assignments match your criteria.</p>
          <button 
            onClick={() => { setSearchTerm(''); setFilterSubject('All'); setFilterPriority('All'); setActiveTab('All'); }}
            className="text-[11px] text-indigo-400 font-extrabold hover:underline mt-1 cursor-pointer"
          >
            Reset Active Filters
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW VIEW (Visible on tablet/desktop, md:block) */}
          <div className="hidden md:block bg-slate-900 border border-slate-805 rounded-2xl overflow-hidden shadow-xl" id="assignments_desktop_table_wrapper">
            <table className="w-full text-left border-collapse" id="assignments_desktop_table">
              <thead>
                <tr className="bg-slate-955 border-b border-slate-805 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-1 animate-pulse" />
                  <th className="py-3 px-4 text-slate-400 cursor-pointer hover:text-slate-200 transition" onClick={() => handleSort('title')}>
                    <div className="flex items-center gap-1.5">
                      <span>Assignment Title</span>
                      {sortField === 'title' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-indigo-400" /> : <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-slate-400 cursor-pointer hover:text-slate-200 transition" onClick={() => handleSort('subjectId')}>
                    <div className="flex items-center gap-1.5">
                      <span>Subject</span>
                      {sortField === 'subjectId' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-indigo-400" /> : <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-slate-400 cursor-pointer hover:text-slate-200 transition" onClick={() => handleSort('dueDate')}>
                    <div className="flex items-center gap-1.5">
                      <span>Due Date</span>
                      {sortField === 'dueDate' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-indigo-400" /> : <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-slate-400 cursor-pointer hover:text-slate-200 transition" onClick={() => handleSort('priority')}>
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      {sortField === 'priority' ? (sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-indigo-400" /> : <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-805 text-xs text-slate-300">
                {filteredTasks.map(task => {
                  const sub = subjects.find(s => s.id === task.subjectId);
                  const isEditing = editingTaskId === task.id;

                  const parsedDueDate = new Date(task.dueDate + 'T12:00:00');
                  const isOverdue = !task.completed && parsedDueDate < new Date(new Date().setHours(0,0,0,0));

                  return (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-slate-950/20 transition-all ${
                        task.completed ? 'opacity-50 line-through bg-slate-955/10' : isOverdue ? 'bg-rose-500/[0.02]' : ''
                      }`}
                    >
                      {/* Checkbox trigger cell */}
                      <td className="py-3.5 px-4 w-1">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          className="hover:scale-110 active:scale-95 transition cursor-pointer"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-full border-2 border-slate-700 hover:border-indigo-400"></div>
                          )}
                        </button>
                      </td>

                      {/* Title input cell */}
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1 px-2 rounded-lg text-xs w-full focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <span className={task.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {task.title}
                          </span>
                        )}
                      </td>

                      {/* Course Subject matching cell */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editSubjectId}
                            onChange={e => setEditSubjectId(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs w-full focus:outline-none"
                          >
                            <option value="">No Course</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        ) : (
                          sub ? (
                            <span 
                              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${sub.color}15`, color: sub.color }}
                            >
                              {sub.name}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">--</span>
                          )
                        )}
                      </td>

                      {/* Due Date matching cell */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="bg-slate-950 border border-slate-800 p-1.5 rounded-lg text-xs text-slate-200 focus:outline-none"
                          />
                        ) : (
                          <span className={`font-semibold flex items-center gap-1 ${
                            isOverdue ? 'text-rose-405 font-bold' : 'text-slate-400'
                          }`}>
                            <Calendar className="h-3 w-3" /> {task.dueDate} {isOverdue && <span className="text-[8px] uppercase px-1 rounded bg-rose-500/10 text-rose-400 font-extrabold ml-1 border border-rose-500/15">Overdue</span>}
                          </span>
                        )}
                      </td>

                      {/* Priority cell */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <select
                            value={editPriority}
                            onChange={e => setEditPriority(e.target.value as any)}
                            className="bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs focus:outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        ) : (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                            task.priority === 'High' 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' 
                              : task.priority === 'Medium' 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-505/15' 
                                : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {task.priority}
                          </span>
                        )}
                      </td>

                      {/* Action buttons cell */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => saveEdit(task.id)}
                              className="bg-emerald-600/20 text-emerald-450 p-1 border border-emerald-500/20 rounded-lg cursor-pointer"
                              title="Save Changes"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => setEditingTaskId(null)}
                              className="bg-slate-800 p-1 text-slate-400 rounded-lg cursor-pointer"
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditing(task)}
                              className="p-1 px-1.5 text-slate-500 hover:text-indigo-400 hover:bg-slate-950 rounded cursor-pointer transition"
                              title="Edit Row"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button 
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 px-1.5 text-slate-500 hover:text-rose-455 hover:bg-slate-950 rounded cursor-pointer transition"
                              title="Delete Row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST DISPLAY (Visible on small screen mobile views) */}
          <div className="block md:hidden space-y-2" id="assignments_mobile_list">
            {filteredTasks.map(task => {
              const sub = subjects.find(s => s.id === task.subjectId);
              const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));

              return (
                <div 
                  key={task.id}
                  className={`p-3 rounded-xl border flex gap-3 ${
                    task.completed ? 'bg-slate-955/20 border-slate-900 opacity-60' : 'bg-slate-900 border-slate-850'
                  }`}
                >
                  <button onClick={() => onToggleTask(task.id)} className="mt-0.5 cursor-pointer">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <div className="h-4.5 w-4.5 rounded-full border-2 border-slate-700"></div>
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold text-xs text-slate-200 truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>
                      {task.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {sub && (
                        <span className="text-[8px] font-bold px-1.5 py-0.2 rounded" style={{ backgroundColor: `${sub.color}15`, color: sub.color }}>
                          {sub.name}
                        </span>
                      )}
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 ${isOverdue ? 'bg-rose-500/10 text-rose-400' : 'text-slate-500'}`}>
                        <Calendar className="h-2.5 w-2.5" /> {task.dueDate}
                      </span>
                      <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-950 text-slate-400">
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-455 self-center cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

    </div>
  );
}
