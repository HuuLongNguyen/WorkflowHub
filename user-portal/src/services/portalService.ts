import { supabase } from '../lib/supabase';
import type { Task, Form, Process, User, Department, Role } from '../types';

export const portalService = {
    // Get all published forms for users to start
    async getForms(): Promise<Form[]> {
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

    // Get all processes
    async getProcesses(): Promise<Process[]> {
        const { data, error } = await supabase.from('processes').select('*');
        if (error) throw error;
        return (data || []).map((p: any) => ({
            ...p,
            updatedAt: p.updated_at,
        })) as Process[];
    },

    // Get directory for approver resolution
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

    // Get tasks for a specific user
    async getMyTasks(userId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('requester_user_id', userId);
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

    // Get tasks pending my approval
    async getPendingApprovals(userId: string): Promise<Task[]> {
        // Fetch all in-progress tasks and filter by approver
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('status', 'IN_PROGRESS');
        if (error) throw error;

        return (data || [])
            .map((t: any) => ({
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
            }))
            .filter((t: Task) => {
                const approvers = t.resolvedApproversByStage[t.currentStageKey] || [];
                return approvers.includes(userId);
            }) as Task[];
    },

    // Create a new task
    async createTask(task: Task): Promise<void> {
        const { error } = await supabase.from('tasks').insert({
            id: task.id,
            form_id: task.formId,
            process_id: task.processId,
            requester_user_id: task.requesterUserId,
            current_stage_key: task.currentStageKey,
            status: task.status,
            resolved_approvers_by_stage: task.resolvedApproversByStage,
            approvals: task.approvals,
            data: task.data,
        });
        if (error) throw error;
    },

    // Update task (for approvals, submissions, etc.)
    async updateTask(task: Task): Promise<void> {
        const { error } = await supabase.from('tasks').update({
            current_stage_key: task.currentStageKey,
            status: task.status,
            resolved_approvers_by_stage: task.resolvedApproversByStage,
            approvals: task.approvals,
            data: task.data,
            updated_at: new Date().toISOString(),
        }).eq('id', task.id);
        if (error) throw error;
    },

    // Get single task by ID
    async getTask(id: string): Promise<Task | null> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return {
            id: data.id,
            formId: data.form_id,
            processId: data.process_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            requesterUserId: data.requester_user_id,
            currentStageKey: data.current_stage_key,
            status: data.status,
            resolvedApproversByStage: data.resolved_approvers_by_stage,
            approvals: data.approvals,
            data: data.data,
        };
    },
};
