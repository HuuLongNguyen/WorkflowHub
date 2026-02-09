import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Checkbox,
    RadioGroup,
    Radio,
    Divider,
    Spinner,
    Chip,
    Avatar,
    User
} from '@nextui-org/react';
import { usePortalStore } from '../store/portalStore';
import { portalService } from '../services/portalService';
import { canViewField, canEditField, isFieldRequired } from '../utils/rules';
import type { Task, Field, TaskApproval } from '../types';

const TaskDetailPage: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<Task | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { currentUser, forms, processes, users, updateTask } = usePortalStore();

    useEffect(() => {
        const loadTask = async () => {
            if (!taskId) return;
            const t = await portalService.getTask(taskId);
            if (t) {
                setTask(t);
                setFormData(t.data || {});
            }
            setLoading(false);
        };
        loadTask();
    }, [taskId]);

    const form = task ? forms.find(f => f.id === task.formId) : null;
    const process = task ? processes.find(p => p.id === task.processId) : null;
    const currentStage = process?.stages.find(s => s.stageKey === task?.currentStageKey);

    const isApprover = task && currentUser &&
        (task.resolvedApproversByStage[task.currentStageKey] || []).includes(currentUser.id);

    const handleFieldChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleAction = async (action: 'APPROVE' | 'REJECT') => {
        if (!task || !currentUser || !process) return;
        setSubmitting(true);
        setError(null);

        try {
            const approval: TaskApproval = {
                stageKey: task.currentStageKey,
                action,
                actedByUserId: currentUser.id,
                actedAt: new Date().toISOString(),
            };

            const sortedStages = [...process.stages].sort((a, b) => a.order - b.order);
            const currentIdx = sortedStages.findIndex(s => s.stageKey === task.currentStageKey);

            let newStatus = task.status;
            let newStageKey = task.currentStageKey;

            if (action === 'REJECT') {
                newStatus = 'REJECTED';
            } else {
                if (currentIdx >= sortedStages.length - 1) {
                    newStatus = 'COMPLETED';
                } else {
                    newStageKey = sortedStages[currentIdx + 1].stageKey;
                }
            }

            const updatedTask: Task = {
                ...task,
                currentStageKey: newStageKey,
                status: newStatus,
                approvals: [...task.approvals, approval],
                data: formData,
                updatedAt: new Date().toISOString(),
            };

            await portalService.updateTask(updatedTask);
            setTask(updatedTask);
            updateTask(task.id, updatedTask);

            if (newStatus === 'COMPLETED' || newStatus === 'REJECTED') {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Action failed:', err);
            setError(`Action failed: ${err.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" label="Loading task..." />
            </div>
        );
    }

    if (!task || !form) {
        return (
            <div className="text-center py-12">
                <p className="text-danger mb-4">Task not found.</p>
                <Button onPress={() => navigate('/')}>Back</Button>
            </div>
        );
    }

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.displayName || 'Unknown';

    const statusColor = task.status === 'COMPLETED' ? 'success' :
        task.status === 'REJECTED' ? 'danger' :
            task.status === 'IN_PROGRESS' ? 'primary' : 'default';

    const renderField = (field: Field) => {
        if (!canViewField(field, task.currentStageKey)) return null;
        const approvers = task.resolvedApproversByStage[task.currentStageKey] || [];
        const editable = isApprover && canEditField(field, task.currentStageKey, currentUser?.id || '', approvers);
        const required = isFieldRequired(field, task.currentStageKey);

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        label={field.label}
                        value={formData[field.key] || ''}
                        isDisabled={!editable}
                        isRequired={required}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        classNames={{ base: "w-full" }}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        label={field.label}
                        value={formData[field.key] || ''}
                        isDisabled={!editable}
                        isRequired={required}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        minRows={4}
                        classNames={{ base: "w-full" }}
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        label={field.label}
                        value={formData[field.key]?.toString() || ''}
                        isDisabled={!editable}
                        isRequired={required}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        classNames={{ base: "w-full" }}
                    />
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        label={field.label}
                        value={formData[field.key] || ''}
                        isDisabled={!editable}
                        isRequired={required}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        classNames={{ base: "w-full" }}
                    />
                );
            case 'select':
            case 'people':
                const options = field.type === 'people'
                    ? users.map(u => ({ id: u.id, label: u.displayName, value: u.id }))
                    : field.options || [];
                return (
                    <Select
                        label={field.label}
                        selectedKeys={formData[field.key] ? [formData[field.key]] : []}
                        isDisabled={!editable}
                        isRequired={required}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        classNames={{ base: "w-full" }}
                    >
                        {options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </Select>
                );
            case 'checkbox':
                return (
                    <Checkbox
                        isSelected={!!formData[field.key]}
                        isDisabled={!editable}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                    >
                        {field.label}
                    </Checkbox>
                );
            case 'radio':
                return (
                    <RadioGroup
                        label={field.label}
                        value={formData[field.key] || ''}
                        isDisabled={!editable}
                        isRequired={required}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                    >
                        {(field.options || []).map(opt => (
                            <Radio key={opt.id} value={opt.value}>{opt.label}</Radio>
                        ))}
                    </RadioGroup>
                );
            default:
                return (
                    <Input
                        label={field.label}
                        value={formData[field.key] || ''}
                        isDisabled={!editable}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        classNames={{ base: "w-full" }}
                    />
                );
        }
    };

    return (
        <div>
            <Button
                variant="light"
                onPress={() => navigate('/')}
                className="mb-4"
            >
                ← Back to Home
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-0">
                            <div className="flex flex-col gap-1">
                                <h1 className="text-2xl font-bold">{form.name}</h1>
                                {currentStage && (
                                    <p className="text-default-500">
                                        Current Stage: <span className="font-semibold">{currentStage.name}</span>
                                    </p>
                                )}
                            </div>
                            <Chip color={statusColor} size="lg" variant="flat">
                                {task.status}
                            </Chip>
                        </CardHeader>
                        <Divider className="my-4" />
                        <CardBody className="gap-6">
                            {error && (
                                <div className="bg-danger-50 text-danger p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {form.sections.map((section, idx) => (
                                <div key={section.id} className="space-y-4">
                                    <h2 className="text-lg font-semibold">{section.title}</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {section.fieldIds?.map(fieldId => {
                                            const field = form.fieldsById[fieldId];
                                            if (!field) return null;
                                            const colSpan = (field.colSpan || 1) === 2 ? 'md:col-span-2' : 'md:col-span-1';
                                            return (
                                                <div key={fieldId} className={colSpan}>
                                                    {renderField(field)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {idx < form.sections.length - 1 && <Divider className="my-6" />}
                                </div>
                            ))}

                            {/* Approval Actions */}
                            {isApprover && task.status === 'IN_PROGRESS' && (
                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                                    <Button
                                        color="danger"
                                        variant="bordered"
                                        isLoading={submitting}
                                        onPress={() => handleAction('REJECT')}
                                    >
                                        Reject
                                    </Button>
                                    <Button
                                        color="success"
                                        isLoading={submitting}
                                        onPress={() => handleAction('APPROVE')}
                                    >
                                        Approve
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Current Approvers */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-sm font-semibold">Current Approvers</h3>
                        </CardHeader>
                        <CardBody className="pt-0 gap-2">
                            {(task.resolvedApproversByStage[task.currentStageKey] || []).map(uid => (
                                <User
                                    key={uid}
                                    name={getUserName(uid)}
                                    description={uid === currentUser?.id ? 'You' : ''}
                                    avatarProps={{
                                        name: getUserName(uid).charAt(0),
                                        size: 'sm',
                                        color: uid === currentUser?.id ? 'primary' : 'default'
                                    }}
                                />
                            ))}
                            {(task.resolvedApproversByStage[task.currentStageKey] || []).length === 0 && (
                                <p className="text-default-500 text-sm">No approvers assigned</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Approval History */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-sm font-semibold">Approval History</h3>
                        </CardHeader>
                        <CardBody className="pt-0 gap-3">
                            {task.approvals.length === 0 ? (
                                <p className="text-default-500 text-sm">No actions yet.</p>
                            ) : (
                                task.approvals.map((approval, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <Avatar
                                            name={getUserName(approval.actedByUserId).charAt(0)}
                                            size="sm"
                                            color={approval.action === 'APPROVE' ? 'success' : 'danger'}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{getUserName(approval.actedByUserId)}</p>
                                            <p className="text-tiny text-default-500">
                                                {approval.action} · {new Date(approval.actedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPage;
