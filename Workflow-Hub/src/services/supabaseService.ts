import { supabase } from '../lib/supabase';
import type { Task, Process, Form, User, Department, Role } from '../types';

export const supabaseService = {
    // Tasks
    async getTasks() {
        const { data, error } = await supabase.from('tasks').select('*');
        if (error) throw error;
        return (data || []).map((t: any) => ({
            id: t.id,
            formId: t.form_id,
            processId: t.process_id,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
            requesterUserId: t.requester_user_id,
            currentStageKey: t.current_stage_key,
            status: t.status,
            resolvedApproversByStage: t.resolved_approvers_by_stage,
            approvals: t.approvals,
            data: t.data,
        })) as Task[];
    },

    async saveTask(task: Task) {
        const { error } = await supabase.from('tasks').upsert({
            id: task.id,
            form_id: task.formId,
            process_id: task.processId,
            requester_user_id: task.requesterUserId,
            current_stage_key: task.currentStageKey,
            status: task.status,
            resolved_approvers_by_stage: task.resolvedApproversByStage,
            approvals: task.approvals,
            data: task.data,
            updated_at: new Date().toISOString(),
        });
        if (error) throw error;
    },

    async deleteTask(id: string) {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
    },

    // Processes
    async getProcesses() {
        const { data, error } = await supabase.from('processes').select('*');
        if (error) throw error;
        return (data || []).map((p: any) => ({
            ...p,
            updatedAt: p.updated_at,
        })) as Process[];
    },

    async saveProcess(process: Process) {
        const { error } = await supabase.from('processes').upsert({
            id: process.id,
            name: process.name,
            version: process.version,
            stages: process.stages,
            updated_at: new Date().toISOString(),
        });
        if (error) throw error;
    },

    // Forms
    async getForms() {
        const { data, error } = await supabase.from('forms').select('*');
        if (error) throw error;
        return (data || []).map((f: any) => ({
            id: f.id,
            name: f.name,
            version: f.version,
            processId: f.process_id,
            sections: f.sections,
            fieldsById: f.fields_by_id,
            updatedAt: f.updated_at,
        })) as Form[];
    },

    async saveForm(form: Form) {
        const { error } = await supabase.from('forms').upsert({
            id: form.id,
            name: form.name,
            version: form.version,
            process_id: form.processId,
            sections: form.sections,
            fields_by_id: form.fieldsById,
            updated_at: new Date().toISOString(),
        });
        if (error) throw error;
    },

    // Directory
    async getDirectory() {
        const [users, departments, roles] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('departments').select('*'),
            supabase.from('roles').select('*'),
        ]);

        if (users.error) throw users.error;
        if (departments.error) throw departments.error;
        if (roles.error) throw roles.error;

        return {
            users: (users.data || []).map((u: any) => ({
                id: u.id,
                displayName: u.display_name || u.email || 'Unknown User',
                email: u.email || '',
                departmentId: u.department_id,
                roleIds: u.role_ids || [],
            })) as User[],
            departments: departments.data as Department[],
            roles: roles.data as Role[],
        };
    },

    async saveProfile(user: User) {
        const payload = {
            id: user.id || undefined,
            display_name: user.displayName,
            email: user.email,
            department_id: user.departmentId || null,
            role_ids: (user.roleIds || []).filter(id => id && id.length > 0),
            updated_at: new Date().toISOString(),
        };
        console.log('Upserting Profile Payload:', JSON.stringify(payload, null, 2));
        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) {
            console.error('Supabase saveProfile error:', error);
            throw error;
        }
    },

    async saveProfilesBulk(users: User[]) {
        const payload = users.map(user => ({
            id: user.id,
            display_name: user.displayName,
            email: user.email,
            department_id: user.departmentId || null,
            role_ids: (user.roleIds || []).filter(id => id && id.length > 0),
            updated_at: new Date().toISOString(),
        }));
        console.log('Bulk Upserting Profiles Payload:', JSON.stringify(payload, null, 2));
        const { error } = await supabase.from('profiles').upsert(payload);
        if (error) {
            console.error('Supabase saveProfilesBulk error:', error);
            throw error;
        }
    },

    async saveDepartment(dept: Department) {
        const { error } = await supabase.from('departments').upsert({
            id: dept.id,
            name: dept.name,
        });
        if (error) throw error;
    },

    async saveDepartmentsBulk(depts: Department[]) {
        const { error } = await supabase.from('departments').upsert(
            depts.map(d => ({ id: d.id, name: d.name }))
        );
        if (error) throw error;
    },

    async saveRole(role: Role) {
        const { error } = await supabase.from('roles').upsert({
            id: role.id,
            name: role.name,
        });
        if (error) throw error;
    },

    async saveRolesBulk(roles: Role[]) {
        const { error } = await supabase.from('roles').upsert(
            roles.map(r => ({ id: r.id, name: r.name }))
        );
        if (error) throw error;
    },

    async deleteProfilesBulk(ids: string[]) {
        const { error } = await supabase.from('profiles').delete().in('id', ids);
        if (error) throw error;
    },

    async deleteDepartmentsBulk(ids: string[]) {
        const { error } = await supabase.from('departments').delete().in('id', ids);
        if (error) throw error;
    },

    async deleteRolesBulk(ids: string[]) {
        const { error } = await supabase.from('roles').delete().in('id', ids);
        if (error) throw error;
    },
};
