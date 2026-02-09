
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskApproval } from '../types';

interface TaskState {
    tasks: Task[];

    addTask: (task: Task) => void;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;

    addApproval: (taskId: string, approval: TaskApproval) => void;

    importTasks: (tasks: Task[]) => void;
}

export const useTaskStore = create<TaskState>()(
    persist(
        (set) => ({
            tasks: [],

            addTask: (task) => set((state) => ({
                tasks: [...state.tasks, task]
            })),

            updateTask: (id, updates) => set((state) => ({
                tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
            })),

            deleteTask: (id) => set((state) => ({
                tasks: state.tasks.filter(t => t.id !== id)
            })),

            addApproval: (taskId, approval) => set((state) => ({
                tasks: state.tasks.map(t => {
                    if (t.id !== taskId) return t;
                    return {
                        ...t,
                        approvals: [...t.approvals, approval],
                        updatedAt: new Date().toISOString()
                    };
                })
            })),

            importTasks: (tasks) => set({ tasks }),
        }),
        {
            name: 'tm_tasks_v1',
        }
    )
);
