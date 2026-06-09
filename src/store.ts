import { useState, useEffect } from 'react';
import { Subject, ClassSchedule, Task, FocusLog, UserProfile } from './types';

// Default subjects
const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Mathematics', color: '#6366f1' }, // Indigo
  { id: 'sub-2', name: 'Physics', color: '#0ea5e9' },     // Sky Blue
  { id: 'sub-3', name: 'Chemistry', color: '#10b981' },   // Emerald Green
  { id: 'sub-4', name: 'Literature', color: '#f59e0b' },  // Amber
  { id: 'sub-5', name: 'History', color: '#ec4899' },     // Pink
];

// Default class schedule
const DEFAULT_CLASSES: ClassSchedule[] = [
  { id: 'cls-1', subjectId: 'sub-1', dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:30', room: 'Room 204' },
  { id: 'cls-2', subjectId: 'sub-2', dayOfWeek: 'Monday', startTime: '11:00', endTime: '12:30', room: 'Lab B' },
  { id: 'cls-3', subjectId: 'sub-3', dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '11:30', room: 'Room 101' },
  { id: 'cls-4', subjectId: 'sub-4', dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '10:30', room: 'Library A' },
  { id: 'cls-5', subjectId: 'sub-5', dayOfWeek: 'Thursday', startTime: '13:00', endTime: '14:30', room: 'Hall 3' },
];

// Default tasks
const DEFAULT_TASKS: Task[] = [
  { id: 'tsk-1', title: 'Calculus Assignment 4', subjectId: 'sub-1', dueDate: new Date().toISOString().split('T')[0], type: 'Assignment', priority: 'High', completed: false },
  { id: 'tsk-2', title: 'Prepare Chemistry Lab Report', subjectId: 'sub-3', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'Assignment', priority: 'Medium', completed: false },
  { id: 'tsk-3', title: 'Read Chapter 5 of Literature Book', subjectId: 'sub-4', dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], type: 'Assignment', priority: 'Low', completed: true, completedAt: new Date().toISOString().split('T')[0] },
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Mercer',
  grade: 'Undergraduate Student',
  dailyStudyGoal: 60, // in minutes
  planType: 'Free',
  darkMode: true,
};

// Local storage keys
const KEYS = {
  SUBJECTS: 'dsp_subjects_v1',
  CLASSES: 'dsp_classes_v1',
  TASKS: 'dsp_tasks_v1',
  FOCUS_LOGS: 'dsp_focus_logs_v1',
  PROFILE: 'dsp_profile_v1',
};

export function getInitialState() {
  const getItem = <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    subjects: getItem<Subject[]>(KEYS.SUBJECTS, DEFAULT_SUBJECTS),
    classes: getItem<ClassSchedule[]>(KEYS.CLASSES, DEFAULT_CLASSES),
    tasks: getItem<Task[]>(KEYS.TASKS, DEFAULT_TASKS),
    focusLogs: getItem<FocusLog[]>(KEYS.FOCUS_LOGS, []),
    profile: getItem<UserProfile>(KEYS.PROFILE, DEFAULT_PROFILE),
  };
}

export function saveState(state: {
  subjects: Subject[];
  classes: ClassSchedule[];
  tasks: Task[];
  focusLogs: FocusLog[];
  profile: UserProfile;
}) {
  try {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(state.subjects));
    localStorage.setItem(KEYS.CLASSES, JSON.stringify(state.classes));
    localStorage.setItem(KEYS.TASKS, JSON.stringify(state.tasks));
    localStorage.setItem(KEYS.FOCUS_LOGS, JSON.stringify(state.focusLogs));
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(state.profile));
  } catch (error) {
    console.error('Error writing state to localStorage:', error);
  }
}
