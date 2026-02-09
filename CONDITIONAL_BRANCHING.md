# Conditional Branching in Workflows

## Overview
Conditional branching allows workflows to take different paths based on form field values. This enables dynamic workflow routing where the next approval stage depends on specific criteria like request amount, department, priority, or any other form field.

## How It Works

### Stage Routing Logic
When a task moves from one stage to another, the system evaluates conditions in the following order:

1. **Condition Evaluation**: If the current stage has conditions defined, they are evaluated **in order from top to bottom**
2. **First Match Wins**: The first condition that evaluates to `true` determines the next stage
3. **Default Route**: If no conditions match and a default route is set, the task goes to that stage
4. **Sequential Fallback**: If no conditions exist or match and no default is set, the task proceeds to the next stage in sequential order

### Condition Structure
Each condition consists of:
- **Field**: The form field to check (e.g., `request_amount`, `department_id`)
- **Operator**: The comparison method
- **Value**: The value to compare against
- **Next Stage**: Where to route if the condition is true

## Supported Operators

| Operator | Description | Example Use Case |
|----------|-------------|------------------|
| `EQUALS` | Field value exactly matches | Department is "Finance" |
| `NOT_EQUALS` | Field value does not match | Status is not "Draft" |
| `CONTAINS` | String contains substring or array includes value | Description contains "urgent" |
| `GREATER_THAN` | Numeric comparison | Amount > 10000 |
| `LESS_THAN` | Numeric comparison | Days <= 5 |
| `IS_EMPTY` | Field is empty or has no value | Comments field is empty |
| `IS_NOT_EMPTY` | Field has a value | Attachment is provided |

## Configuration Guide

### In the Workflow Builder (Admin Portal)

1. **Navigate to Process Builder**
   - Go to Processes → Select your process → Click Edit

2. **Add/Edit a Stage**
   - Create or select the stage that needs branching logic

3. **Click "Add Branching"** button
   - This opens the Conditional Branching dialog

4. **Define Conditions**
   - Click "Add Condition" to create a new rule
   - Select the **form field** you want to check
   - Choose the **operator** (equals, greater than, etc.)
   - Enter the **value** to compare against
   - Select the **next stage** to route to if true

5. **Set Default Route** (Optional)
   - At the bottom of the dialog, set a default stage
   - This applies when none of the conditions match

6. **Save**
   - Your conditions are now active!

### Example: Budget Approval Workflow

**Scenario**: Different approval paths based on request amount

```
Stage: Manager Review
├─ Condition 1:
│  IF request_amount GREATER_THAN 100000
│  THEN go to "CFO Approval"
│
├─ Condition 2:
│  IF request_amount GREATER_THAN 10000
│  THEN go to "Director Approval"
│
└─ Default:
   go to "Finance Review"
```

**Flow**:
- Amount > $100,000 → CFO Approval
- Amount > $10,000 (but ≤ $100,000) → Director Approval
- Amount ≤ $10,000 → Finance Review

### Example: Department-Specific Routing

```
Stage: Initial Review
├─ Condition 1:
│  IF department_field EQUALS "IT"
│  THEN go to "IT Manager Approval"
│
├─ Condition 2:
│  IF department_field EQUALS "HR"
│  THEN go to "HR Director Approval"
│
└─ Default:
   go to "General Approval"
```

## Advanced Use Cases

### 1. Skip Stages for Low-Priority Requests
```
Stage: Priority Assessment
├─ Condition:
│  IF priority EQUALS "low"
│  THEN go to "$COMPLETE" (Complete Workflow)
│
└─ Default:
   go to "Standard Approval Chain"
```

### 2. Re-route Based on Multiple Fields
Create multiple conditions on the same stage to check different fields:
```
Stage: Routing Stage
├─ IF urgency EQUALS "immediate" → Expedited Approval
├─ IF amount GREATER_THAN 50000 → Senior Leadership
├─ IF category EQUALS "capital" → Finance Committee
└─ Default → Standard Process
```

### 3. Loop Back for Corrections
You can route to earlier stages:
```
Stage: Quality Check
├─ IF issues_found IS_NOT_EMPTY
│  THEN go back to "Initial Draft" (earlier stage)
│
└─ Default:
   Continue to "Final Approval"
```

## Runtime Behavior

### Task Approval
When an approver approves a task:
1. System marks the approval in the task history
2. Evaluates the current stage's conditions using the task's form data
3. Determines the next stage based on matching conditions
4. Updates `currentStageKey` in the task
5. Resolves new approvers for the next stage
6. Task becomes available to those approvers

### Completion
A workflow completes when:
- A condition routes to `"$COMPLETE"` (Complete Workflow option)
- The last stage in sequential order is approved with no further routing
- A stage with no next route is approved

## Technical Implementation

### Type Definitions
```typescript
export type ConditionOperator = 
  | "EQUALS" 
  | "NOT_EQUALS" 
  | "CONTAINS" 
  | "GREATER_THAN" 
  | "LESS_THAN" 
  | "IS_EMPTY" 
  | "IS_NOT_EMPTY";

export interface StageCondition {
    id: string;
    fieldKey: string;
    operator: ConditionOperator;
    value: any;
    nextStageKey: string; // or "$COMPLETE"
}

export interface Stage {
    // ... other fields
    conditions?: StageCondition[];
    defaultNextStageKey?: string;
}
```

### Evaluation Function
Located in `utils/conditionEvaluator.ts`:
```typescript
import { evaluateCondition, getNextStageKey } from './utils/conditionEvaluator';

// Get next stage
const nextStage = getNextStageKey(
    currentTask.currentStageKey,
    process.stages,
    currentTask.data
);
```

## Best Practices

### 1. Order Matters
Conditions are evaluated top-to-bottom. Place **more specific** conditions first:
```
✅ Good:
  1. amount > 100000 → CFO
  2. amount > 10000 → Director
  3. Default → Manager

❌ Poor:
  1. amount > 10000 → Director (catches everything > 10k!)
  2. amount > 100000 → CFO (never reached)
```

### 2. Always Set a Default
Avoid undefined routing by setting a default next stage.

### 3. Test Your Logic
Use the Resolution Preview panel to verify approver resolution, and test with actual task submissions.

### 4. Document Complex Branching
For workflows with many conditions, add comments in the stage name or maintain separate documentation.

### 5. Avoid Infinite Loops
Be careful when routing backwards to prevent circular flows:
- Set clear exit conditions
- Use status fields to track iterations
- Consider maximum retry counts

## Troubleshooting

**Issue**: Condition not triggering
- ✓ Verify the field key exists in the form
- ✓ Check the data type (string vs number)
- ✓ Ensure the value format matches (case-sensitive for strings)

**Issue**: Workflow stuck
- ✓ Check if the next stage key exists
- ✓ Verify default route is set
- ✓ Look for circular references

**Issue**: Wrong approvers assigned
- ✓ Condition might be routing to unexpected stage
- ✓ Use Resolution Preview to debug

## Future Enhancements
- [ ] AND/OR logic between conditions
- [ ] Nested condition groups
- [ ] Variables and calculations in conditions
- [ ] Time-based routing
- [ ] External API condition checks
