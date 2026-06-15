export interface Subject {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind color string
}

export interface ClassSchedule {
  id: string;
  subjectId: string;
  className?: string; // Optional custom title, otherwise uses subject name
  dayOfWeek: string;  // "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  room?: string;      // Room number / URL
}

export interface Task {
  id: string;
  title: string;
  subjectId?: string; // Associated subject
  dueDate: string;    // "YYYY-MM-DD"
  type: 'Assignment' | 'Exam' | 'Event' | 'StudySession' | 'Task';
  startTime?: string;
  endTime?: string;
  location?: string;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  completedAt?: string; // "YYYY-MM-DD"
}

export interface FocusLog {
  id: string;
  durationMinutes: number;
  dateTime: string;    // "YYYY-MM-DD" or timestamp
  subjectId?: string;  // Subject focused on
  notes?: string;      // Optional session notes
}

export interface UserProfile {
  name: string;
  grade?: string;      // e.g. "Senior Year", "College"
  dailyStudyGoal: number; // in minutes
  planType: 'Free' | 'Premium';
  darkMode: boolean;
  avatarColor?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  updatedAt: string; // ISO string
}

