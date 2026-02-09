
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Process } from '../types';

interface ProcessState {
    processes: Process[];

    addProcess: (process: Process) => void;
    updateProcess: (id: string, updates: Partial<Process>) => void;
    deleteProcess: (id: string) => void;
    importProcesses: (processes: Process[]) => void;
}

export const useProcessStore = create<ProcessState>()(
    persist(
        (set) => ({
            processes: [],

            addProcess: (process) => set((state) => ({
                processes: [...state.processes, process]
            })),

            updateProcess: (id, updates) => set((state) => ({
                processes: state.processes.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
            })),

            deleteProcess: (id) => set((state) => ({
                processes: state.processes.filter(p => p.id !== id)
            })),

            importProcesses: (processes) => set({ processes }),
        }),
        {
            name: 'tm_processes_v1',
        }
    )
);
