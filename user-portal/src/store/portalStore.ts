import { create } from 'zustand';
import type { User, Form, Process, Task, Department, Role } from '../types';

interface PortalState {
    // Current user context
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;

    // Directory
    users: User[];
    departments: Department[];
    roles: Role[];
    setDirectory: (data: { users: User[], departments: Department[], roles: Role[] }) => void;

    // Forms & Processes
    forms: Form[];
    processes: Process[];
    setForms: (forms: Form[]) => void;
    setProcesses: (processes: Process[]) => void;

    // Tasks
    myTasks: Task[];
    pendingApprovals: Task[];
    setMyTasks: (tasks: Task[]) => void;
    setPendingApprovals: (tasks: Task[]) => void;
    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
}

export const usePortalStore = create<PortalState>()((set) => ({
    currentUser: null,
    setCurrentUser: (user) => set({ currentUser: user }),

    users: [],
    departments: [],
    roles: [],
    setDirectory: (data) => set({
        users: data.users || [],
        departments: data.departments || [],
        roles: data.roles || [],
    }),

    forms: [],
    processes: [],
    setForms: (forms) => set({ forms }),
    setProcesses: (processes) => set({ processes }),

    myTasks: [],
    pendingApprovals: [],
    setMyTasks: (tasks) => set({ myTasks: tasks }),
    setPendingApprovals: (tasks) => set({ pendingApprovals: tasks }),
    addTask: (task) => set((state) => ({ myTasks: [...state.myTasks, task] })),
    updateTask: (id, updates) => set((state) => ({
        myTasks: state.myTasks.map(t => t.id === id ? { ...t, ...updates } : t),
        pendingApprovals: state.pendingApprovals.map(t => t.id === id ? { ...t, ...updates } : t),
    })),
}));
