import type { StageCondition } from '../types';

/**
 * Evaluates a single condition against form data
 */
export const evaluateCondition = (
    condition: StageCondition,
    formData: Record<string, any>
): boolean => {
    const fieldValue = formData[condition.fieldKey];
    const { operator, value } = condition;

    switch (operator) {
        case 'EQUALS':
            return fieldValue === value;

        case 'NOT_EQUALS':
            return fieldValue !== value;

        case 'CONTAINS':
            if (typeof fieldValue === 'string') {
                return fieldValue.includes(value);
            }
            if (Array.isArray(fieldValue)) {
                return fieldValue.includes(value);
            }
            return false;

        case 'GREATER_THAN':
            return Number(fieldValue) > Number(value);

        case 'LESS_THAN':
            return Number(fieldValue) < Number(value);

        case 'IS_EMPTY':
            return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0);

        case 'IS_NOT_EMPTY':
            return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0);

        default:
            return false;
    }
};

/**
 * Determines the next stage based on conditions
 * Returns the stageKey of the next stage, or null if workflow should complete
 */
export const getNextStageKey = (
    currentStageKey: string,
    processStages: any[],
    formData: Record<string, any>
): string | null => {
    const currentStage = processStages.find(s => s.stageKey === currentStageKey);

    if (!currentStage) return null;

    // If stage has conditions, evaluate them
    if (currentStage.conditions && currentStage.conditions.length > 0) {
        for (const condition of currentStage.conditions) {
            if (evaluateCondition(condition, formData)) {
                return condition.nextStageKey;
            }
        }

        // If no condition matched and there's a default next stage
        if (currentStage.defaultNextStageKey) {
            return currentStage.defaultNextStageKey;
        }
    }

    // Fall back to sequential order
    const sortedStages = [...processStages].sort((a, b) => a.order - b.order);
    const currentIndex = sortedStages.findIndex(s => s.stageKey === currentStageKey);

    if (currentIndex >= sortedStages.length - 1) {
        return null; // Workflow complete
    }

    return sortedStages[currentIndex + 1].stageKey;
};
