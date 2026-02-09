
// ==========================================
// DIRECTORY
// ==========================================
export interface Department {
    id: string;
    name: string;
}

export interface Role {
    id: string;
    name: string;
}

export interface User {
    id: string;
    displayName: string;
    email: string;
    departmentId: string;
    roleIds: string[];
}

// ==========================================
// PROCESS
// ==========================================
export type ApproverSelectorType = "USER" | "DEPARTMENT" | "ROLE" | "DEPT_ROLE";

export interface ApproverSelector {
    type: ApproverSelectorType;
    userIds?: string[];
    departmentIds?: string[];
    roleIds?: string[];
    deptRolePairs?: { departmentId: string; roleId: string }[];
    dedupe: boolean;
}

// Conditional Branching Types
export type ConditionOperator = "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GREATER_THAN" | "LESS_THAN" | "IS_EMPTY" | "IS_NOT_EMPTY";

export interface StageCondition {
    id: string;
    fieldKey: string; // The form field to check
    operator: ConditionOperator;
    value: any; // The value to compare against
    nextStageKey: string; // The stage to route to if condition is true
}

export interface Stage {
    id: string;
    name: string;
    stageKey: string;
    approverSelectors: ApproverSelector[];
    approvalMode: "ANY_ONE" | "ALL";
    order: number;
    // Conditional Branching: if empty, goes to next stage in order
    // if conditions exist, evaluates them and routes accordingly
    conditions?: StageCondition[];
    // Default next stage if no conditions match (optional, falls back to order+1)
    defaultNextStageKey?: string;
}

export interface Process {
    id: string;
    name: string;
    version: number;
    stages: Stage[];
    updatedAt: string;
}

// ==========================================
// FORM
// ==========================================
export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "checkbox" | "radio" | "people" | "attachment";

export type RuleInheritance = "INHERIT" | "SHOW" | "HIDE" | "EDITABLE" | "READONLY" | "REQUIRED" | "OPTIONAL";

export interface FieldStageRule {
    visible: "INHERIT" | "SHOW" | "HIDE";
    editable: "INHERIT" | "EDITABLE" | "READONLY";
    required: "INHERIT" | "REQUIRED" | "OPTIONAL";
    onlyApproversCanEdit?: boolean;
}

export interface FieldOption {
    id: string;
    label: string;
    value: string;
}

export interface Field {
    id: string;
    key: string;
    label: string;
    type: FieldType;
    requiredDefault: boolean;
    placeholder?: string;
    helpText?: string;
    defaultValue?: any;
    options?: FieldOption[];
    rulesByStage: Record<string, FieldStageRule>; // key is stageKey
    colSpan?: number; // 1 (50%) or 2 (100%)
}

export interface Section {
    id: string;
    title: string;
    description?: string;
    fieldIds: string[];
}

export interface Form {
    id: string;
    name: string;
    version: number;
    processId: string;
    sections: Section[];
    fieldsById: Record<string, Field>;
    updatedAt: string;
}

// ==========================================
// TASK
// ==========================================
export type TaskStatus = "DRAFT" | "IN_PROGRESS" | "REJECTED" | "COMPLETED";

export interface TaskApproval {
    stageKey: string;
    action: "APPROVE" | "REJECT";
    actedByUserId: string;
    actedAt: string;
}

export interface Task {
    id: string;
    formId: string;
    processId: string;
    createdAt: string;
    updatedAt: string;
    requesterUserId: string;
    currentStageKey: string;
    status: TaskStatus;
    resolvedApproversByStage: Record<string, string[]>; // stageKey -> userIds[]
    approvals: TaskApproval[];
    data: Record<string, any>;
}
