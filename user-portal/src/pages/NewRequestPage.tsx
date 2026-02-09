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
    Chip
} from '@nextui-org/react';
import { v4 as uuidv4 } from 'uuid';
import { usePortalStore } from '../store/portalStore';
import { portalService } from '../services/portalService';
import { resolveApprovers, canViewField, canEditField, isFieldRequired } from '../utils/rules';
import type { Task, Field } from '../types';
import { ProcessStagePreview } from '../components/ProcessStagePreview';

const NewRequestPage: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);

    const {
        currentUser,
        forms, processes, users, departments, roles,
        addTask
    } = usePortalStore();

    const form = forms.find(f => f.id === formId);
    const process = form ? processes.find(p => p.id === form.processId) : null;

    useEffect(() => {
        if (forms.length > 0) {
            setLoading(false);
            if (form) {
                const defaults: Record<string, any> = {};
                Object.values(form.fieldsById).forEach((field: Field) => {
                    defaults[field.key] = field.defaultValue ?? '';
                });
                setFormData(defaults);
            }
        }
    }, [forms, form]);

    const handleFieldChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!form || !process || !currentUser) {
            setError('Missing form, process, or user context.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const directory = { users, departments, roles };
            const resolvedApproversByStage = resolveApprovers(process, directory, {
                requesterUserId: currentUser.id,
                requesterDepartmentId: currentUser.departmentId
            });

            const firstStage = process.stages.sort((a, b) => a.order - b.order)[0];

            const newTask: Task = {
                id: uuidv4(),
                formId: form.id,
                processId: process.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                requesterUserId: currentUser.id,
                currentStageKey: firstStage?.stageKey || 'initial',
                status: 'IN_PROGRESS',
                resolvedApproversByStage,
                approvals: [],
                data: formData,
            };

            await portalService.createTask(newTask);
            addTask(newTask);
            navigate('/');
        } catch (err: any) {
            console.error('Failed to submit request:', err);
            setError(`Submission failed: ${err.message || 'Unknown error'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" label="Loading form..." />
            </div>
        );
    }

    if (!form) {
        return (
            <div className="text-center py-12">
                <p className="text-danger mb-4">Form not found.</p>
                <Button onPress={() => navigate('/')}>Back to Home</Button>
            </div>
        );
    }

    const stageKey = process?.stages[0]?.stageKey || 'initial';

    const renderField = (field: Field) => {
        if (!canViewField(field, stageKey)) return null;
        const editable = canEditField(field, stageKey, currentUser?.id || '', []);
        const required = isFieldRequired(field, stageKey);

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        label={field.label}
                        placeholder={field.placeholder}
                        description={field.helpText}
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
                        placeholder={field.placeholder}
                        description={field.helpText}
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
                        placeholder={field.placeholder}
                        description={field.helpText}
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
                        description={field.helpText}
                        value={formData[field.key] || ''}
                        isDisabled={!editable}
                        isRequired={required}
                        onValueChange={(val) => handleFieldChange(field.key, val)}
                        classNames={{ base: "w-full" }}
                    />
                );
            case 'select':
                return (
                    <Select
                        label={field.label}
                        placeholder="Select an option"
                        selectedKeys={formData[field.key] ? [formData[field.key]] : []}
                        isDisabled={!editable}
                        isRequired={required}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        classNames={{ base: "w-full" }}
                    >
                        {(field.options || []).map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </Select>
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
            case 'people':
                return (
                    <Select
                        label={field.label}
                        placeholder="Select a person"
                        selectedKeys={formData[field.key] ? [formData[field.key]] : []}
                        isDisabled={!editable}
                        isRequired={required}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        classNames={{ base: "w-full" }}
                    >
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                                {u.displayName}
                            </SelectItem>
                        ))}
                    </Select>
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
        <div className="max-w-7xl mx-auto px-4">
            <Button
                variant="light"
                onPress={() => navigate('/')}
                className="mb-4"
            >
                ← Back to Home
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Form Area */}
                <div className="lg:col-span-2">
                    <Card className="shadow-lg">
                        <CardHeader className="flex flex-col items-start gap-2 pb-0">
                            <h1 className="text-2xl sm:text-3xl font-bold">{form.name}</h1>
                            {process && (
                                <div className="flex items-center gap-2 text-default-500">
                                    <span>Workflow: {process.name}</span>
                                    <Chip size="sm" variant="flat">{process.stages.length} stages</Chip>
                                </div>
                            )}
                        </CardHeader>
                        <Divider className="my-4" />
                        <CardBody className="gap-6">
                            {error && (
                                <div className="bg-danger-50 text-danger p-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {form.sections.map((section, sectionIdx) => (
                                <div key={section.id} className="space-y-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">{section.title}</h2>
                                        {section.description && (
                                            <p className="text-small text-default-500">{section.description}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {section.fieldIds?.map(fieldId => {
                                            const field = form.fieldsById[fieldId];
                                            if (!field) return null;
                                            const colSpanClass = (field.colSpan || 1) === 2 ? 'md:col-span-2' : 'md:col-span-1';
                                            return (
                                                <div key={fieldId} className={colSpanClass}>
                                                    {renderField(field)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {sectionIdx < form.sections.length - 1 && <Divider className="my-6" />}
                                </div>
                            ))}

                            <div className="flex justify-end pt-4">
                                <Button
                                    color="primary"
                                    size="lg"
                                    isLoading={submitting}
                                    onPress={handleSubmit}
                                    isDisabled={!currentUser}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar: Workflow Preview */}
                <div className="lg:col-span-1 sticky top-6">
                    {process && currentUser && (
                        <ProcessStagePreview
                            process={process}
                            requesterUserId={currentUser.id}
                            requesterDepartmentId={currentUser.departmentId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewRequestPage;
