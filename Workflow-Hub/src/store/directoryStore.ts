
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Department, Role } from '../types';

interface DirectoryState {
    users: User[];
    departments: Department[];
    roles: Role[];

    addUser: (user: User) => void;
    updateUser: (id: string, user: User) => void;
    deleteUser: (id: string) => void;

    addDepartment: (dept: Department) => void;
    updateDepartment: (id: string, dept: Department) => void;
    deleteDepartment: (id: string) => void;

    addRole: (role: Role) => void;
    updateRole: (id: string, role: Role) => void;
    deleteRole: (id: string) => void;

    importDirectory: (data: { users: User[], departments: Department[], roles: Role[] }) => void;
}

export const useDirectoryStore = create<DirectoryState>()(
    persist(
        (set) => ({
            users: [],
            departments: [],
            roles: [],

            addUser: (user) => set((state) => ({ users: [...state.users, user] })),
            updateUser: (id, user) => set((state) => ({
                users: state.users.map(u => u.id === id ? user : u)
            })),
            deleteUser: (id) => set((state) => ({
                users: state.users.filter(u => u.id !== id)
            })),

            addDepartment: (dept) => set((state) => ({ departments: [...state.departments, dept] })),
            updateDepartment: (id, dept) => set((state) => ({
                departments: state.departments.map(d => d.id === id ? dept : d)
            })),
            deleteDepartment: (id) => set((state) => ({
                departments: state.departments.filter(d => d.id !== id)
            })),

            addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
            updateRole: (id, role) => set((state) => ({
                roles: state.roles.map(r => r.id === id ? role : r)
            })),
            deleteRole: (id) => set((state) => ({
                roles: state.roles.filter(r => r.id !== id)
            })),

            importDirectory: (data) => set({
                users: data.users || [],
                departments: data.departments || [],
                roles: data.roles || []
            }),
        }),
        {
            name: 'tm_directory_v1',
        }
    )
);
