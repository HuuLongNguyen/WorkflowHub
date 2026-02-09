
import { z } from 'zod';
import type {
    Process, Form, Field, User, Department, Role,
    FieldStageRule
} from '../types';

/**
 * Slugifies a label to a camelCase key
 */
export const slugify = (label: string): string => {
    return label
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, '');
};

/**
 * Resolves approvers for all stages in a process based on the directory and requester context
 */
export const resolveApprovers = (
    process: Process,
    directory: { users: User[], departments: Department[], roles: Role[] },
    _context: { requesterUserId: string, requesterDepartmentId?: string }
): Record<string, string[]> => {
    const resolved: Record<string, string[]> = {};

    process.stages.forEach(stage => {
        const userIds = new Set<string>();

        stage.approverSelectors.forEach(selector => {
            switch (selector.type) {
                case "USER":
                    selector.userIds?.forEach(id => userIds.add(id));
                    break;
                case "DEPARTMENT":
                    selector.departmentIds?.forEach(deptId => {
                        directory.users
                            .filter(u => u.departmentId === deptId)
                            .forEach(u => userIds.add(u.id));
                    });
                    break;
                case "ROLE":
                    selector.roleIds?.forEach(roleId => {
                        directory.users
                            .filter(u => u.roleIds.includes(roleId))
                            .forEach(u => userIds.add(u.id));
                    });
                    break;
                case "DEPT_ROLE":
                    selector.deptRolePairs?.forEach(pair => {
                        directory.users
                            .filter(u => u.departmentId === pair.departmentId && u.roleIds.includes(pair.roleId))
                            .forEach(u => userIds.add(u.id));
                    });
                    break;
            }
        });

        resolved[stage.stageKey] = Array.from(userIds);
    });

    return resolved;
};

/**
 * Field Rule Evaluation Helpers
 */

export const getFieldRule = (field: Field, stageKey: string): FieldStageRule => {
    const rule = field.rulesByStage[stageKey];
    return rule || { visible: "INHERIT", editable: "INHERIT", required: "INHERIT" };
};

export const canViewField = (
    field: Field,
    stageKey: string
): boolean => {
    const rule = getFieldRule(field, stageKey);
    if (rule.visible === "SHOW") return true;
    if (rule.visible === "HIDE") return false;
    // INHERIT: Default to show
    return true;
};

export const canEditField = (
    field: Field,
    stageKey: string,
    actorUserId: string,
    resolvedApprovers: string[]
): boolean => {
    const rule = getFieldRule(field, stageKey);

    // Visibility check first
    if (!canViewField(field, stageKey)) return false;

    // "Only approvers can edit" constraint
    if (rule.onlyApproversCanEdit && !resolvedApprovers.includes(actorUserId)) return false;

    if (rule.editable === "EDITABLE") return true;
    if (rule.editable === "READONLY") return false;

    // INHERIT: Default to editable
    return true;
};

export const isFieldRequired = (
    field: Field,
    stageKey: string
): boolean => {
    const rule = getFieldRule(field, stageKey);
    if (rule.required === "REQUIRED") return true;
    if (rule.required === "OPTIONAL") return false;

    // INHERIT: Use default
    return field.requiredDefault;
};

/**
 * Build dynamic Zod schema for a specific stage and actor
 */
export const buildZodSchema = (
    form: Form,
    stageKey: string,
    actorUserId: string,
    resolvedApprovers: Record<string, string[]>
) => {
    const shape: any = {};
    const currentStageApprovers = resolvedApprovers[stageKey] || [];

    Object.values(form.fieldsById).forEach(field => {
        // Only include in schema if it's visible AND editable for the current actor
        const visible = canViewField(field, stageKey);
        if (!visible) return;

        const editable = canEditField(field, stageKey, actorUserId, currentStageApprovers);
        const required = isFieldRequired(field, stageKey);

        let baseSchema: any;

        switch (field.type) {
            case "number":
                baseSchema = z.number();
                break;
            case "checkbox":
                baseSchema = z.boolean();
                break;
            case "date":
            case "text":
            case "textarea":
            case "select":
            case "radio":
            case "people":
            case "attachment":
                baseSchema = z.string();
                break;
            default:
                baseSchema = z.any();
        }

        if (!editable) {
            // If not editable, we don't strictly care about validation in the form, 
            // but it's safer to make it optional since user can't change it.
            shape[field.key] = baseSchema.optional();
        } else {
            if (required) {
                if (field.type === 'text' || field.type === 'textarea') {
                    shape[field.key] = baseSchema.min(1, `${field.label} is required`);
                } else {
                    shape[field.key] = baseSchema;
                }
            } else {
                shape[field.key] = baseSchema.optional().nullable();
            }
        }
    });

    return z.object(shape);
};
