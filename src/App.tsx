import React, { useState, useEffect } from 'react';
import { usePlanner } from './context/PlannerContext';
import HomeDashboard from './components/HomeDashboard';
import PlannerView from './components/PlannerView';
import TasksView from './components/TasksView';
import FocusView from './components/FocusView';
import NotesView from './components/NotesView';
import ProgressView from './components/ProgressView';
import ProfileView from './components/ProfileView';
import ExamsView from './components/ExamsView';
import TimetableView from './components/TimetableView';

import { 
  Home, Calendar, CheckSquare, Clock, Table, Sparkles, LogIn, LogOut, 
  RefreshCw, Database, FileText, TrendingUp, AlertTriangle, User, 
  Plus, Bell, ChevronDown, Check, Sliders, Menu, X, BookOpen, Search
} from 'lucide-react';

import AppIcon from './assets/images/uploaded_user_icon_1781429865349.jpg';

export default function App() {
  const {
    subjects,
    classes,
    tasks,
    focusLogs,
    profile,
    currentUser,
    loading,
    isFirebaseActive,
    login,
    logout,
    updateProfile,
    addSubject,
    deleteSubject,
    addClass,
    deleteClass,
    editClass,
    addTask,
    editTask,
    deleteTask,
    toggleTask,
    addFocusSession
  } = usePlanner();

  const [activeTab, setActiveTab] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggles for headers
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);

  // Quick action modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'task' | 'exam' | 'note'>('task');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSubjectId, setQuickSubjectId] = useState('');
  const [quickDueDate, setQuickDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [quickPriority, setQuickPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto close overlays on navigation
  useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
    setShowMobileMoreMenu(false);
  }, [activeTab]);

  // Handle Global Search Input
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    // Set view to Tasks/Assignments and apply title filter automatically!
    setActiveTab('tasks');
  };

  // Handle Global Quick Add Form submission
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    if (quickAddType === 'task') {
      addTask(quickTitle.trim(), quickSubjectId, quickDueDate, quickPriority);
      setActiveTab('tasks');
    } else if (quickAddType === 'exam') {
      addTask(
        quickTitle.trim(),
        quickSubjectId || undefined,
        quickDueDate,
        quickPriority,
        'Exam'
      );
      setActiveTab('exams');
    } else if (quickAddType === 'note') {
      // Simulate notes insertion to localStorage
      try {
        const storedStr = localStorage.getItem('dsp_notes_v1');
        const list = storedStr ? JSON.parse(storedStr) : [];
        const newNote = {
          id: `note-${Date.now()}`,
          title: quickTitle.trim(),
          content: 'Quickly recorded study concept details...',
          subjectId: quickSubjectId || undefined,
          updatedAt: new Date().toISOString(),
        };
        list.unshift(newNote);
        localStorage.setItem('dsp_notes_v1', JSON.stringify(list));
      } catch (err) {
        console.error(err);
      }
      setActiveTab('notes');
    }

    // Reset fields
    setQuickTitle('');
    setQuickSubjectId('');
    setQuickDueDate(new Date().toISOString().split('T')[0]);
    setIsQuickAddOpen(false);
  };

  // Notifications logic counts
  const overdueCount = tasks.filter(t => !t.completed && t.dueDate < todayStr).length;
  const examCount = tasks.filter(t => t.type === 'Exam' && !t.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4" id="app_loading_screen">
        <div className="relative">
          <div className="p-1 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 animate-pulse">
            <img src={AppIcon} className="h-14 w-14 rounded-xl object-cover shadow-lg" alt="Digital Study Planner Logo" referrerPolicy="no-referrer" />
          </div>
          <div className="absolute inset-0 -m-3 border border-indigo-450 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-xs font-semibold text-indigo-300 tracking-widest uppercase animate-pulse mt-4">
          Syncing Study Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row" id="app_root">

      {/* 1. FIXED LEFT SIDEBAR (Visible on laptop/desktop screens >= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-850 shrink-0 h-screen fixed top-0 left-0 p-5 justify-between z-40" id="desktop_layout_sidebar">
        <div className="space-y-6">
          {/* Logo Branding */}
          <div className="flex items-center gap-2 px-1">
            <img src={AppIcon} className="h-9 w-9 rounded-xl object-cover shadow-lg shadow-indigo-500/10 border border-indigo-500/10" alt="Planner Logo" referrerPolicy="no-referrer" />
            <div>
              <p className="font-display font-medium text-white tracking-tight text-sm">Digital Study Planner</p>
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Master Syllabus</p>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="space-y-1.5" id="desktop_sidebar_menus">
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'planner', label: 'Calendar', icon: Calendar },
              { id: 'timetable', label: 'Timetable', icon: Table },
              { id: 'tasks', label: 'Assignments', icon: CheckSquare },
              { id: 'exams', label: 'Exams', icon: AlertTriangle, count: examCount > 0 ? examCount : undefined },
              { id: 'focus', label: 'Study Sessions', icon: Clock },
              { id: 'notes', label: 'Notes', icon: FileText },
              { id: 'progress', label: 'Progress', icon: TrendingUp },
              { id: 'profile', label: 'Settings', icon: User },
            ].map((menu) => {
              const IconComp = menu.icon;
              const isSelected = activeTab === menu.id;

              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveTab(menu.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="h-4.5 w-4.5 shrink-0" />
                    <span>{menu.label}</span>
                  </div>

                  {menu.count && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${isSelected ? 'bg-indigo-705 text-white' : 'bg-slate-950 text-indigo-400'}`}>
                      {menu.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-850/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full ${profile.avatarColor || 'bg-indigo-600'} text-xs font-black text-white flex items-center justify-center uppercase shrink-0`}>
              {(profile.name || 'User').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] font-bold text-white truncate">{profile.name}</p>
              <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold mt-0.5">
                <span>{profile.planType} Account</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT-SIDE MAIN PANEL (Compensates for the 64-width sidebar on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64" id="desktop_layout_right_canvas">

        {/* TOP HEADER BAR (Mobile bar matches search and overlays) */}
        <header className="sticky top-0 bg-slate-950/85 backdrop-blur-md z-30 border-b border-slate-900/60 py-3.5 px-4 flex items-center justify-between" id="global_workspace_top_header">
          {/* Logo on mobile / Search Bar on Desktop */}
          <div className="flex items-center gap-3">
            {/* Mobile-Only toggle label */}
            <div className="lg:hidden flex items-center gap-2">
              <img src={AppIcon} className="h-7 w-7 rounded-lg object-cover shadow border border-indigo-500/10" alt="Icon" referrerPolicy="no-referrer" />
              <span className="font-display font-medium text-xs text-white tracking-tight">DSP Planner</span>
            </div>

            {/* Desktop search bar form */}
            <form onSubmit={handleGlobalSearch} className="hidden lg:flex relative items-center max-w-sm">
              <Search className="absolute left-3 h-4 w-4 text-slate-505" />
              <input
                type="text"
                placeholder="Global filter assignments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-850 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-205 focus:outline-none focus:border-indigo-505 placeholder-slate-600 w-64 focus:w-80 transition-all duration-300"
              />
            </form>
          </div>

          {/* Quick Add, Notifications, Profile controls */}
          <div className="flex items-center gap-2.5">
            {/* Quick Add trigger */}
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-600 font-extrabold text-[11px] py-1.5 px-3 rounded-xl shadow-lg cursor-pointer transition text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">QUICK ADD</span>
            </button>

            {/* Notifications Bell with badge overlay list */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                className="p-2 bg-slate-900 border border-slate-850/60 text-slate-350 hover:text-white rounded-xl cursor-pointer transition-colors"
              >
                <Bell className="h-3.5 w-3.5" />
                {overdueCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 space-y-2 z-50 text-left animate-fade-in-down">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-1.5">🚨 Student Alerts</p>
                  <div className="space-y-1.5 text-[11px] font-bold">
                    {overdueCount > 0 ? (
                      <div className="p-1 px-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-300">
                        🔔 You have {overdueCount} overdue assignments checklist lines!
                      </div>
                    ) : (
                      <div className="p-1 px-2 rounded-lg bg-emerald-955/10 border border-emerald-900/40 text-emerald-400">
                        ✓ All assignment due schedules are safe.
                      </div>
                    )}
                    
                    {examCount > 0 && (
                      <div className="p-1 px-2 rounded-lg bg-indigo-950/15 border border-indigo-900/30 text-indigo-300 mt-1">
                        🎓 {examCount} upcoming examination cards tracked.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown trigger menu */}
            <div className="relative">
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-850/80 rounded-xl cursor-pointer hover:border-slate-800"
              >
                <div className={`w-6 h-6 rounded-lg ${profile.avatarColor || 'bg-indigo-650'} text-[10px] font-black text-white flex items-center justify-center uppercase`}>
                  {(profile.name || 'User').slice(0, 2)}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2.5 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-left animate-fade-in-down text-xs font-bold text-slate-350">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-left p-2 hover:bg-slate-950/50 hover:text-white rounded-lg cursor-pointer"
                  >
                    ⚙️ Settings & Goals
                  </button>
                  <button 
                    onClick={() => setActiveTab('progress')}
                    className="w-full text-left p-2 hover:bg-slate-950/50 hover:text-white rounded-lg cursor-pointer"
                  >
                    📈 Performance Charts
                  </button>
                  <div className="border-t border-slate-850 my-1" />
                  <p className="text-[10px] px-2 text-slate-500 italic font-medium">Logged: {profile.name}</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN VISUAL CANVAS CONTAINER (1400px Centered grid) */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6" id="primary_central_canvas">
          
          {activeTab === 'home' && (
            <HomeDashboard
              profile={profile}
              subjects={subjects}
              classes={classes}
              tasks={tasks}
              focusLogs={focusLogs}
              onAddTask={addTask}
              onNavigate={(tab) => setActiveTab(tab)}
              onToggleTask={toggleTask}
            />
          )}

          {activeTab === 'planner' && (
            <PlannerView
              subjects={subjects}
              classes={classes}
              tasks={tasks}
              onAddClass={addClass}
              onEditClass={editClass}
              onDeleteClass={deleteClass}
              onAddTask={addTask}
              onEditTask={editTask}
              onDeleteTask={deleteTask}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              subjects={subjects}
              profile={profile}
              onAddTask={addTask}
              onEditTask={editTask}
              onDeleteTask={deleteTask}
              onToggleTask={toggleTask}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsView
              tasks={tasks}
              subjects={subjects}
              onAddTask={addTask}
              onDeleteTask={deleteTask}
              onToggleTask={toggleTask}
            />
          )}

          {activeTab === 'focus' && (
            <FocusView
              subjects={subjects}
              focusLogs={focusLogs}
              profile={profile}
              onAddFocusSession={addFocusSession}
            />
          )}

          {activeTab === 'notes' && (
            <NotesView
              subjects={subjects}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView
              subjects={subjects}
              tasks={tasks}
              focusLogs={focusLogs}
              profile={profile}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={profile}
              tasks={tasks}
              focusLogs={focusLogs}
              subjects={subjects}
              subjectsCount={subjects.length}
              classesCount={classes.length}
              onUpdateProfile={updateProfile}
              onAddSubject={addSubject}
              onDeleteSubject={deleteSubject}
            />
          )}

          {activeTab === 'timetable' && (
            <TimetableView
              subjects={subjects}
              classes={classes}
              onAddClass={(newCls) => addClass(newCls.subjectId, newCls.className || '', newCls.dayOfWeek, newCls.startTime, newCls.endTime, newCls.room)}
              onEditClass={(cls) => editClass(cls.id, cls)}
              onDeleteClass={(id) => deleteClass(id)}
            />
          )}

        </main>
      </div>

      {/* 3. PERSISTENT LOWER TABBED NAVIGATION (Visible ONLY on mobile formats < 1024px) */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-900 bg-slate-955/90 backdrop-blur-md py-1 px-4 z-40 filter drop-shadow-2xl lg:hidden" id="mobile_bottom_nav">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {[
            { id: 'home', label: 'Dashboard', icon: Home },
            { id: 'planner', label: 'Calendar', icon: Calendar },
            { id: 'tasks', label: 'Checklist', icon: CheckSquare },
            { id: 'focus', label: 'Study Timer', icon: Clock },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer relative ${
                  isSelected ? 'text-indigo-400' : 'text-slate-500'
                }`}
              >
                <TabIcon className="h-5 w-5 mb-0.5" />
                <span className="text-[9px] font-black tracking-normal">{tab.label}</span>
                {isSelected && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-indigo-400"></span>
                )}
              </button>
            );
          })}

          {/* "More" Trigger for mobile drawer overflow */}
          <button
            onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 cursor-pointer ${showMobileMoreMenu ? 'text-indigo-400' : ''}`}
          >
            <Menu className="h-5 w-5 mb-0.5 animate-pulse" />
            <span className="text-[9px] font-black tracking-normal">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile drawer options popup modal */}
      {showMobileMoreMenu && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm lg:hidden text-left" onClick={() => setShowMobileMoreMenu(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 filter drop-shadow-2xl animate-fade-in-down"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider">Expand Study Tools</span>
              <button onClick={() => setShowMobileMoreMenu(false)} className="text-slate-550 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

             <div className="grid grid-cols-2 gap-3.5 text-xs font-extrabold text-slate-300">
              <button
                onClick={() => { setActiveTab('exams'); setShowMobileMoreMenu(false); }}
                className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center gap-2"
              >
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                <span>Exams Hub</span>
              </button>

              <button
                onClick={() => { setActiveTab('timetable'); setShowMobileMoreMenu(false); }}
                className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center gap-2"
              >
                <Table className="h-4.5 w-4.5 text-amber-500" />
                <span>Timetable</span>
              </button>

              <button
                onClick={() => { setActiveTab('notes'); setShowMobileMoreMenu(false); }}
                className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center gap-2"
              >
                <FileText className="h-4.5 w-4.5 text-pink-500" />
                <span>Class Notes</span>
              </button>

              <button
                onClick={() => { setActiveTab('progress'); setShowMobileMoreMenu(false); }}
                className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center gap-2"
              >
                <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => { setActiveTab('profile'); setShowMobileMoreMenu(false); }}
                className="p-3 bg-slate-950 border border-slate-850 rounded-2xl flex items-center gap-2 col-span-2 justify-center"
              >
                <User className="h-4.5 w-4.5 text-indigo-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL QUICK ADD MODAL DIALOG CONTAINER */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm text-left animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-sm relative shadow-2xl space-y-4">
            
            <button
              onClick={() => setIsQuickAddOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-950 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display font-medium text-white tracking-tight">Quick Action Center</h3>
              <p className="text-[10px] text-slate-450">Instantly record tasks, notes, or test schedules from anywhere.</p>
            </div>

            {/* Type selector pill sets */}
            <div className="bg-slate-950 p-1 border border-slate-850 rounded-xl grid grid-cols-3 gap-1 text-[10px] font-black text-center">
              {[
                { type: 'task', label: 'ADD TASK' },
                { type: 'exam', label: 'ADD EXAM' },
                { type: 'note', label: 'ADD NOTE' },
              ].map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setQuickAddType(opt.type as any)}
                  className={`py-1.5 rounded-lg cursor-pointer transition uppercase ${
                    quickAddType === opt.type
                      ? 'bg-indigo-650/40 text-indigo-300'
                      : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleQuickAddSubmit} className="space-y-3.5 text-xs text-slate-300">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder={`Write ${quickAddType} title...`}
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Subject Course</label>
                <select
                  value={quickSubjectId}
                  onChange={e => setQuickSubjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-slate-200 focus:outline-none"
                >
                  <option value="">No Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {quickAddType !== 'note' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={quickDueDate}
                      onChange={e => setQuickDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-220 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Priority Weight</label>
                    <select
                      value={quickPriority}
                      onChange={e => setQuickPriority(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold rounded-xl shadow-lg transition cursor-pointer"
              >
                RESOLVE ITEM
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
