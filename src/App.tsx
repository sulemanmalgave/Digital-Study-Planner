import { useState } from 'react';
import { usePlanner } from './context/PlannerContext';
import HomeDashboard from './components/HomeDashboard';
import PlannerView from './components/PlannerView';
import TasksView from './components/TasksView';
import FocusView from './components/FocusView';
import TimetableView from './components/TimetableView';
import ProfileView from './components/ProfileView';

import { Home, Calendar, CheckSquare, Clock, Table, Sparkles, LogIn, LogOut, RefreshCw, Database } from 'lucide-react';


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

  // Bottom Navigation configuration
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'focus', label: 'Focus', icon: Clock },
    { id: 'timetable', label: 'Timetable', icon: Table },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4" id="app_loading_screen">
        <div className="relative">
          <div className="p-4 rounded-full bg-indigo-600/10 border border-indigo-500/20 animate-pulse">
            <Sparkles className="h-8 w-8 text-indigo-400" />
          </div>
          <div className="absolute inset-0 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">
          Synchronizing Your Digital Study Planner...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-6" id="app_root">

      {/* Main Container Frame */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6" id="main_screen_area">
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

        {activeTab === 'focus' && (
          <FocusView
            subjects={subjects}
            focusLogs={focusLogs}
            profile={profile}
            onAddFocusSession={addFocusSession}
          />
        )}

        {activeTab === 'timetable' && (
          <TimetableView
            subjects={subjects}
            classes={classes}
            onAddClass={addClass}
            onEditClass={editClass}
            onDeleteClass={deleteClass}
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
      </main>

      {/* Persistent Bottom Tabbed Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-900 bg-slate-950/90 backdrop-blur-md py-2 md:py-3 px-4 z-40 filter drop-shadow-2xl" id="bottom_nav">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-1.5 md:px-3 rounded-xl transition-all cursor-pointer relative ${
                  isSelected 
                    ? 'text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
                id={`tab_${tab.id}`}
              >
                <TabIcon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-bold tracking-normal">
                  {tab.label}
                </span>
                
                {isSelected && (
                  <span className="absolute bottom-0 w-1 h-1 rounded-full bg-indigo-400"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
