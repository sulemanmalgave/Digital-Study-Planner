import React, { useState } from 'react';
import { Subject, Task } from '../types';
import { 
  CheckSquare, Calendar, Plus, Trash2, Edit2, Check, X, Filter, 
  Search, Clock, AlertCircle, Sparkles, Flame, CheckCircle2 
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
  // Navigation tabs for filter states
  const [activeTab, setActiveTab] = useState<TabType>('All');
  
  // Search and minor filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  // Simple task add form states
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
      setFormError('Free limit reached (Max 50 tasks allowed). Upgrade to Premium in Profile!');
      return;
    }

    const ok = onAddTask(title.trim(), subjectId, dueDate, priority);
    if (ok) {
      setTitle('');
      setSubjectId('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setPriority('Medium');
      setFormError('');
      setShowAddSection(false); // Hide after addition
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

  // Perform task filtering and sorting based on Tab + Search + Sorting
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = String(task.title || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by active Tab
      let matchesTab = true;
      if (activeTab === 'Today') {
        matchesTab = task.dueDate === todayStr && !task.completed;
      } else if (activeTab === 'Upcoming') {
        matchesTab = task.dueDate > todayStr && !task.completed;
      } else if (activeTab === 'Completed') {
        matchesTab = task.completed;
      } else {
        // 'All' matches pending tasks or any by default
        matchesTab = true;
      }

      // Dropdown matchers
      const matchesSubject = filterSubject === 'All' || task.subjectId === filterSubject;
      const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;

      return matchesSearch && matchesTab && matchesSubject && matchesPriority;
    })
    .sort((a, b) => {
      // Completed items go to the bottom of lists always
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (sortBy === 'dueDate') {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        const pWeight = { High: 3, Medium: 2, Low: 1 };
        return pWeight[b.priority] - pWeight[a.priority];
      }
      return a.title.localeCompare(b.title);
    });

  const pendingCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="space-y-4" id="tasks_tab">
      
      {/* Header compact bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-900/60 rounded-xl border border-slate-800 gap-3">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5 animate-fade-in">
            <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
            Checklist Workspace
          </h1>
          <p className="text-slate-400 text-[11px] mt-0.5">Toggle rows, track due dates and manage your focus targets in a single click.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-slate-950 font-semibold px-2 py-1 border border-slate-850 text-slate-350 rounded-lg">
            Active Pending: <span className="text-indigo-400 font-extrabold">{pendingCount}</span>
          </span>
          <button
            onClick={() => setShowAddSection(!showAddSection)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-md transition"
            id="btn_toggle_add_task"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Slide-out/Drop-down Task addition form */}
      {showAddSection && (
        <form onSubmit={handleCreateTask} className="bg-slate-900 border border-slate-805 p-3.5 rounded-xl space-y-3.5 shadow-xl animate-fade-in-down" id="add_task_form_workspace">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Plan a New Student Assignment
            </span>
            <button 
              type="button" 
              onClick={() => { setShowAddSection(false); setFormError(''); }} 
              className="text-slate-500 hover:text-slate-200 text-xs font-bold"
            >
              Close Form
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Task Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Solve pg 20 math problems"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-505"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Course Subject</label>
              <select
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">-- Optional --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Priority Target</label>
              <div className="grid grid-cols-3 gap-1">
                {(['Low', 'Medium', 'High'] as const).map(pr => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setPriority(pr)}
                    className={`py-1.5 rounded-md text-[10px] font-bold border transition-all ${
                      priority === pr
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-450 bg-rose-955/20 p-2 rounded border border-rose-900">{formError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-850/60">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg transition"
            >
              Add Row Item
            </button>
          </div>
        </form>
      )}

      {/* FILTER TABS & SUB-CONTROLS ROW */}
      <div className="bg-slate-900/20 border border-slate-850 p-2.5 rounded-xl flex flex-col md:flex-row gap-3 justify-between items-center" id="tasks_workspace_filters">
        
        {/* Modern Inline Filter Tabs (All, Today, Upcoming, Completed) */}
        <div className="flex gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-850/60 w-full md:w-auto overflow-x-auto shrink-0">
          {(['All', 'Today', 'Upcoming', 'Completed'] as TabType[]).map(tab => {
            const count = tasks.filter(t => {
              if (tab === 'Today') return t.dueDate === todayStr && !t.completed;
              if (tab === 'Upcoming') return t.dueDate > todayStr && !t.completed;
              if (tab === 'Completed') return t.completed;
              return !t.completed; // 'All' counts active
            }).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase transition-all tracking-wide shrink-0 ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                }`}
              >
                {tab} <span className={`ml-1 text-[10px] font-extrabold px-1.5 rounded-full ${activeTab === tab ? 'bg-indigo-705/50 text-white' : 'bg-slate-900 text-slate-500'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Sub dropdown filters for perfect narrow-down matching */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-[11px] justify-end">
          
          {/* Quick Search */}
          <div className="relative w-full max-w-[150px] sm:max-w-none">
            <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Filter titles..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subjects dropdown mapping */}
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-405 focus:outline-none"
          >
            <option value="All">All Courses</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Priority dropdown mapping */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-405 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Sort selector mapping */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 font-bold text-slate-405 focus:outline-none"
          >
            <option value="dueDate">Sort: Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="title">Sort: Alpha</option>
          </select>
        </div>
      </div>

      {/* SPACE UTILIZATION CHECKLIST GRID AREA */}
      <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1" id="tasks_checklist_piles">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/10 border border-dashed border-slate-800 rounded-xl">
            <p className="text-slate-500 text-xs">No checklist tasks match these filters.</p>
            <p className="text-[10px] text-indigo-400 mt-0.5 cursor-pointer hover:underline" onClick={() => {
              setSearchTerm('');
              setActiveTab('All');
              setFilterSubject('All');
              setFilterPriority('All');
            }}>Reset active filters</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const matchSubject = subjects.find(s => s.id === task.subjectId);
            const subColor = matchSubject ? matchSubject.color : '#64748b';
            const isEditing = editingTaskId === task.id;

            const parsedDueDate = new Date(task.dueDate + 'T12:00:00');
            const isOverdue = !task.completed && parsedDueDate < new Date(new Date().setHours(0,0,0,0));

            return (
              <div 
                key={task.id}
                className={`group p-2 rounded-lg border transition-all flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 relative ${
                  task.completed 
                    ? 'border-slate-900 bg-slate-955/20 opacity-55' 
                    : isOverdue 
                      ? 'border-rose-500/20 bg-rose-955/5 hover:border-rose-500/30' 
                      : 'border-slate-850 bg-slate-900/25 hover:border-slate-800 hover:bg-slate-905/40'
                }`}
              >
                {/* Inline Editing Form */}
                {isEditing ? (
                  <div className="flex-1 w-full space-y-2 border-slate-800 border-dashed border p-2 rounded bg-slate-950">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="bg-slate-900 text-xs text-slate-200 border border-slate-800 p-1.5 rounded focus:outline-none"
                        placeholder="Task title..."
                      />
                      <select
                        value={editSubjectId}
                        onChange={e => setEditSubjectId(e.target.value)}
                        className="bg-slate-900 text-xs text-slate-200 border border-slate-800 p-1.5 rounded focus:outline-none"
                      >
                        <option value="">No Subject</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={e => setEditDueDate(e.target.value)}
                        className="bg-slate-900 text-xs text-slate-200 border border-slate-800 p-1.5 rounded focus:outline-none"
                      />
                      <select
                        value={editPriority}
                        onChange={e => setEditPriority(e.target.value as any)}
                        className="bg-slate-900 text-xs text-slate-200 border border-slate-800 p-1.5 rounded"
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  
                  /* List row presentation (compact, Notion/Todoist inspired) */
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Toggle Checkbox */}
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className="p-0.5 rounded-full hover:bg-slate-800 text-slate-500 hover:text-indigo-400 cursor-pointer shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500 fill-indigo-500/10" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-slate-700 hover:border-indigo-400"></div>
                      )}
                    </button>

                    {/* Title and subject pills */}
                    <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5">
                      <p className={`text-xs font-semibold text-slate-100 truncate ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      
                      {/* Compact subject indicator tag */}
                      {matchSubject && (
                        <span 
                          className="text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 self-start sm:self-auto"
                          style={{ backgroundColor: `${subColor}15`, color: subColor, border: `1px solid ${subColor}25` }}
                        >
                          {matchSubject.name}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Badges and action row (all aligned tightly in a single row) */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 border-t sm:border-transparent pt-1.5 sm:pt-0 border-slate-850">
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => saveEdit(task.id)}
                        className="bg-emerald-600/20 text-emerald-400 p-1 rounded-md border border-emerald-500/20"
                        title="Save Changes"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => setEditingTaskId(null)}
                        className="bg-slate-800 text-slate-400 p-1 rounded-md"
                        title="Cancel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Due Date Indicator */}
                      <span className={`text-[10px] flex items-center gap-1 ${
                        isOverdue 
                          ? 'text-red-400 font-bold bg-red-950/20 border border-red-900/30 px-1 py-0.2 rounded' 
                          : task.completed 
                            ? 'text-slate-550' 
                            : 'text-slate-400'
                      }`}>
                        <Calendar className="h-2.5 w-2.5" /> {task.dueDate}
                      </span>

                      {/* Compact Priority chip */}
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                        task.priority === 'High' 
                          ? 'bg-rose-500/10 text-rose-405 border border-rose-500/15' 
                          : task.priority === 'Medium' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' 
                            : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {task.priority}
                      </span>

                      {/* Desktop hover actions list / mobile touch handles */}
                      <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(task)}
                          className="p-1 hover:text-indigo-400 hover:bg-slate-800 text-slate-550 rounded"
                          title="Edit Title/Details"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 hover:text-rose-455 hover:bg-slate-800 text-slate-550 rounded"
                          title="Remove Task"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
