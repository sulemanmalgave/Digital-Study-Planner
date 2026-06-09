import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';

import { Subject, ClassSchedule, Task, FocusLog, UserProfile } from '../types';
import { getInitialState, saveState } from '../store';
import { db, auth, isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase';

// Interface managing planner system states
interface PlannerContextType {
  subjects: Subject[];
  classes: ClassSchedule[];
  tasks: Task[];
  focusLogs: FocusLog[];
  profile: UserProfile;
  currentUser: User | null;
  loading: boolean;
  isFirebaseActive: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  
  // App setters
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  addSubject: (name: string, color: string) => Promise<boolean>;
  deleteSubject: (id: string) => Promise<void>;
  addClass: (
    subjectId: string,
    className: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    room?: string
  ) => Promise<boolean>;
  deleteClass: (id: string) => Promise<void>;
  editClass: (id: string, updated: Partial<ClassSchedule>) => Promise<void>;
  addTask: (
    title: string | any,
    subjectId?: string,
    dueDate?: string,
    priority?: 'Low' | 'Medium' | 'High'
  ) => Promise<boolean>;
  editTask: (id: string, updated: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  addFocusSession: (durationMinutes: number, subjectId?: string) => Promise<void>;
}

const PlannerContext = createContext<PlannerContextType | undefined>(undefined);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => getInitialState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor Authentication State
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Upon direct sign-in, we load user state from firestore or upload if empty
        await syncUserInitialData(user);
      } else {
        // When signing out, switch back to local default storage state
        setState(getInitialState());
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync data to/from Firestore triggers for active authenticated session
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) {
      // Local fallbacks: save to local storage
      saveState(state);
      return;
    }

    const userId = currentUser.uid;

    // Listen to profile
    const unsubProfile = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        setState((prev) => ({
          ...prev,
          profile: docSnap.data() as UserProfile,
        }));
      }
    }, (error) => {
      // CRITICAL error callback
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    });

    // Listen to subjects
    const subjectsQuery = query(collection(db, 'subjects'), where('userId', '==', userId));
    const unsubSubjects = onSnapshot(subjectsQuery, (snap) => {
      const dbSubjects: Subject[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        dbSubjects.push({ id: d.id, name: d.name, color: d.color });
      });
      // Sort subjects cleanly
      setState((prev) => ({ ...prev, subjects: dbSubjects }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'subjects');
    });

    // Listen to class schedules
    const classesQuery = query(collection(db, 'classes'), where('userId', '==', userId));
    const unsubClasses = onSnapshot(classesQuery, (snap) => {
      const dbClasses: ClassSchedule[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        dbClasses.push({
          id: d.id,
          subjectId: d.subjectId,
          className: d.className,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          room: d.room,
        });
      });
      setState((prev) => ({ ...prev, classes: dbClasses }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'classes');
    });

    // Listen to tasks
    const tasksQuery = query(collection(db, 'tasks'), where('userId', '==', userId));
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      const dbTasks: Task[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        dbTasks.push({
          id: d.id,
          title: d.title,
          subjectId: d.subjectId || undefined,
          dueDate: d.dueDate,
          priority: (d.priority || 'Medium') as 'Low' | 'Medium' | 'High',
          completed: d.completed || false,
          completedAt: d.completedAt || undefined,
          type: d.type || 'Task',
          startTime: d.startTime || undefined,
          endTime: d.endTime || undefined,
          location: d.location || undefined,
        });
      });
      setState((prev) => ({ ...prev, tasks: dbTasks }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'tasks');
    });

    // Listen to focus logs
    const logsQuery = query(collection(db, 'focusLogs'), where('userId', '==', userId));
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      const dbLogs: FocusLog[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        dbLogs.push({
          id: d.id,
          durationMinutes: d.durationMinutes,
          dateTime: d.dateTime,
          subjectId: d.subjectId,
        });
      });
      // Sort by newest log entries first
      dbLogs.sort((a, b) => b.dateTime.localeCompare(a.dateTime));
      setState((prev) => ({ ...prev, focusLogs: dbLogs }));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'focusLogs');
    });

    return () => {
      unsubProfile();
      unsubSubjects();
      unsubClasses();
      unsubTasks();
      unsubLogs();
    };
  }, [currentUser]);

  // Handle first time setup & synchronize local structures onto Cloud Firestore
  const syncUserInitialData = async (user: User) => {
    try {
      const profileRef = doc(db, 'users', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        // User profile is new! Let's upload local storage values to cloud
        const localData = getInitialState();
        
        // Write profile
        await setDoc(profileRef, {
          name: user.displayName || localData.profile.name,
          grade: localData.profile.grade || 'Student',
          dailyStudyGoal: localData.profile.dailyStudyGoal || 60,
          planType: 'Free',
          darkMode: localData.profile.darkMode
        });

        // Batch upload subjects
        if (localData.subjects.length > 0) {
          const batch = writeBatch(db);
          localData.subjects.forEach((sub) => {
            const ref = doc(db, 'subjects', sub.id);
            batch.set(ref, {
              id: sub.id,
              name: sub.name,
              color: sub.color,
              userId: user.uid,
            });
          });
          await batch.commit();
        }

        // Batch upload class schedules
        if (localData.classes.length > 0) {
          const batch = writeBatch(db);
          localData.classes.forEach((cls) => {
            const ref = doc(db, 'classes', cls.id);
            batch.set(ref, {
              id: cls.id,
              subjectId: cls.subjectId,
              className: cls.className || '',
              dayOfWeek: cls.dayOfWeek,
              startTime: cls.startTime,
              endTime: cls.endTime,
              room: cls.room || '',
              userId: user.uid,
            });
          });
          await batch.commit();
        }

        // Batch upload tasks
        if (localData.tasks.length > 0) {
          const batch = writeBatch(db);
          localData.tasks.forEach((tsk) => {
            const ref = doc(db, 'tasks', tsk.id);
            batch.set(ref, {
              id: tsk.id,
              title: tsk.title,
              subjectId: tsk.subjectId || '',
              dueDate: tsk.dueDate,
              priority: tsk.priority,
              completed: tsk.completed,
              completedAt: tsk.completedAt || '',
              userId: user.uid,
            });
          });
          await batch.commit();
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Migration/Initial Sync failed:", err);
      setLoading(false);
    }
  };

  // Google Login popup
  const login = async () => {
    if (!isFirebaseConfigured) {
      alert("Firebase configuration is a placeholder. Connected locally instead!");
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // Google Sign out
  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
  };

  // Profile operations
  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `users/${currentUser.uid}`;
      try {
        const ref = doc(db, 'users', currentUser.uid);
        await updateDoc(ref, updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updated },
      }));
    }
  };

  // Subject operations
  const addSubject = async (name: string, color: string): Promise<boolean> => {
    const id = `sub-${Date.now()}`;
    const newSub: Subject = { id, name, color };

    if (isFirebaseConfigured && currentUser) {
      const pathValue = `subjects/${id}`;
      try {
        await setDoc(doc(db, 'subjects', id), {
          id,
          name,
          color,
          userId: currentUser.uid,
        });
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, pathValue);
        return false;
      }
    } else {
      setState((prev) => ({
        ...prev,
        subjects: [...prev.subjects, newSub],
      }));
      return true;
    }
  };

  const deleteSubject = async (id: string) => {
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `subjects/${id}`;
      try {
        await deleteDoc(doc(db, 'subjects', id));
        // Note: Rules will lock but client schedules/tasks associated with it can be cleaned locally or by batch manually
        // We will execute deleted cascade elements below
        const classesQuery = query(collection(db, 'classes'), where('subjectId', '==', id), where('userId', '==', currentUser.uid));
        // We trigger manual deletions for associated elements
        // This keeps the database cleanly synchronized!
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, pathValue);
      }
    } else {
      setState((prev) => {
        const cleanedClasses = prev.classes.filter((c) => c.subjectId !== id);
        const cleanedTasks = prev.tasks.map((t) =>
          t.subjectId === id ? { ...t, subjectId: undefined } : t
        );
        const cleanedSubjects = prev.subjects.filter((s) => s.id !== id);

        return {
          ...prev,
          subjects: cleanedSubjects,
          classes: cleanedClasses,
          tasks: cleanedTasks,
        };
      });
    }
  };

  // Class Schedule operations
  const addClass = async (
    subjectId: string,
    className: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    room?: string
  ): Promise<boolean> => {
    const id = `cls-${Date.now()}`;
    const newClass: ClassSchedule = {
      id,
      subjectId,
      className: className || undefined,
      dayOfWeek,
      startTime,
      endTime,
      room: room || undefined,
    };

    if (isFirebaseConfigured && currentUser) {
      const pathValue = `classes/${id}`;
      try {
        await setDoc(doc(db, 'classes', id), {
          id,
          subjectId,
          className: className || '',
          dayOfWeek,
          startTime,
          endTime,
          room: room || '',
          userId: currentUser.uid,
        });
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, pathValue);
        return false;
      }
    } else {
      setState((prev) => ({
        ...prev,
        classes: [...prev.classes, newClass],
      }));
      return true;
    }
  };

  const deleteClass = async (id: string) => {
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `classes/${id}`;
      try {
        await deleteDoc(doc(db, 'classes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== id),
      }));
    }
  };

  const editClass = async (id: string, updated: Partial<ClassSchedule>) => {
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `classes/${id}`;
      try {
        const ref = doc(db, 'classes', id);
        await updateDoc(ref, updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        classes: prev.classes.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
    }
  };

  // Task operations
  const addTask = async (
    titleOrObj: string | any,
    subjectId?: string,
    dueDate?: string,
    priority: 'Low' | 'Medium' | 'High' = 'Medium',
    type: 'Assignment' | 'Exam' | 'Event' | 'StudySession' | 'Task' = 'Task',
    startTime?: string,
    endTime?: string,
    location?: string
  ): Promise<boolean> => {
    const id = `tsk-${Date.now()}`;
    let finalTask: Task;

    if (titleOrObj && typeof titleOrObj === 'object') {
      finalTask = {
        id,
        title: titleOrObj.title || '',
        subjectId: titleOrObj.subjectId || undefined,
        dueDate: titleOrObj.dueDate || new Date().toISOString().split('T')[0],
        priority: titleOrObj.priority || 'Medium',
        type: titleOrObj.type || 'Task',
        startTime: titleOrObj.startTime || undefined,
        endTime: titleOrObj.endTime || undefined,
        location: titleOrObj.location || undefined,
        completed: titleOrObj.completed || false,
        completedAt: titleOrObj.completedAt || undefined,
      };
    } else {
      finalTask = {
        id,
        title: titleOrObj || '',
        subjectId: subjectId || undefined,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        priority,
        type,
        startTime,
        endTime,
        location,
        completed: false,
      };
    }

    if (isFirebaseConfigured && currentUser) {
      const pathValue = `tasks/${id}`;
      try {
        await setDoc(doc(db, 'tasks', id), {
          id: finalTask.id,
          title: finalTask.title,
          subjectId: finalTask.subjectId || '',
          dueDate: finalTask.dueDate,
          priority: finalTask.priority,
          completed: finalTask.completed,
          completedAt: finalTask.completedAt || '',
          type: finalTask.type,
          startTime: finalTask.startTime || '',
          endTime: finalTask.endTime || '',
          location: finalTask.location || '',
          userId: currentUser.uid,
        });
        return true;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, pathValue);
        return false;
      }
    } else {
      setState((prev) => ({
        ...prev,
        tasks: [...prev.tasks, finalTask],
      }));
      return true;
    }
  };

  const editTask = async (id: string, updated: Partial<Task>) => {
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `tasks/${id}`;
      try {
        const ref = doc(db, 'tasks', id);
        await updateDoc(ref, updated);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      }));
    }
  };

  const deleteTask = async (id: string) => {
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `tasks/${id}`;
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
    }
  };

  const toggleTask = async (id: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (isFirebaseConfigured && currentUser) {
      const pathValue = `tasks/${id}`;
      try {
        const taskRef = doc(db, 'tasks', id);
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
          const currentTask = taskSnap.data() as Task;
          const nextCompleted = !currentTask.completed;
          await updateDoc(taskRef, {
            completed: nextCompleted,
            completedAt: nextCompleted ? todayStr : '',
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id === id) {
            const nextCompleted = !t.completed;
            return {
              ...t,
              completed: nextCompleted,
              completedAt: nextCompleted ? todayStr : undefined,
            };
          }
          return t;
        }),
      }));
    }
  };

  // Focus Sessions operations
  const addFocusSession = async (durationMinutes: number, subjectId?: string) => {
    const id = `log-${Date.now()}`;
    const log: FocusLog = {
      id,
      durationMinutes,
      dateTime: new Date().toISOString().split('T')[0],
      subjectId,
    };

    if (isFirebaseConfigured && currentUser) {
      const pathValue = `focusLogs/${id}`;
      try {
        await setDoc(doc(db, 'focusLogs', id), {
          id,
          durationMinutes,
          dateTime: log.dateTime,
          subjectId: subjectId || '',
          userId: currentUser.uid,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, pathValue);
      }
    } else {
      setState((prev) => ({
        ...prev,
        focusLogs: [log, ...prev.focusLogs],
      }));
    }
  };

  return (
    <PlannerContext.Provider
      value={{
        subjects: state.subjects,
        classes: state.classes,
        tasks: state.tasks,
        focusLogs: state.focusLogs,
        profile: state.profile,
        currentUser,
        loading,
        isFirebaseActive: isFirebaseConfigured,
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
        addFocusSession,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context = useContext(PlannerContext);
  if (context === undefined) {
    throw new Error('usePlanner must be used within a PlannerProvider');
  }
  return context;
}
