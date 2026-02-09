
import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Button, Stack, Paper, TextField, Divider,
    IconButton, Card, CardHeader, CardContent, FormControl,
    InputLabel, Select, MenuItem, Chip,
    AppBar, Toolbar
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    DragIndicator as DragIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useProcessStore } from '../../store/processStore';
import { useDirectoryStore } from '../../store/directoryStore';
import type { Process, Stage, ApproverSelector, ApproverSelectorType } from '../../types';
import { resolveApprovers } from '../../utils/rules';
import { supabaseService } from '../../services/supabaseService';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ==========================================
// SORTABLE STAGE ITEM
// ==========================================
interface SortableStageProps {
    stage: Stage;
    onEdit: (id: string, updates: Partial<Stage>) => void;
    onDelete: (id: string) => void;
}

const SortableStage = ({ stage, onEdit, onDelete }: SortableStageProps) => {
    const { users, departments, roles } = useDirectoryStore();
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: 16
    };

    const addSelector = () => {
        const newSelector: ApproverSelector = { type: 'USER', userIds: [], dedupe: true };
        onEdit(stage.id, { approverSelectors: [...stage.approverSelectors, newSelector] });
    };

    const updateSelector = (index: number, updates: Partial<ApproverSelector>) => {
        const newList = [...stage.approverSelectors];
        newList[index] = { ...newList[index], ...updates };
        onEdit(stage.id, { approverSelectors: newList });
    };

    const removeSelector = (index: number) => {
        const newList = stage.approverSelectors.filter((_, i) => i !== index);
        onEdit(stage.id, { approverSelectors: newList });
    };

    return (
        <Card ref={setNodeRef} style={style} variant="outlined" sx={{ borderLeft: '6px solid', borderColor: 'primary.main' }}>
            <CardHeader
                avatar={<IconButton {...attributes} {...listeners} size="small"><DragIcon /></IconButton>}
                action={<IconButton color="error" onClick={() => onDelete(stage.id)}><DeleteIcon /></IconButton>}
                title={
                    <Stack direction="row" spacing={2}>
                        <TextField
                            size="small" label="Stage Name" value={stage.name}
                            onChange={e => onEdit(stage.id, { name: e.target.value })}
                        />
                        <TextField
                            size="small" label="Stage Key (Unique)" value={stage.stageKey}
                            onChange={e => onEdit(stage.id, { stageKey: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                        />
                    </Stack>
                }
            />
            <Divider />
            <CardContent>
                <Typography variant="subtitle2" gutterBottom fontWeight="700">Approver Rules</Typography>
                <Stack spacing={2}>
                    {stage.approverSelectors.map((sel, idx) => (
                        <Paper key={idx} sx={{ p: 2, bgcolor: 'action.hover' }} variant="outlined">
                            <Stack direction="row" spacing={2} alignItems="center">
                                <FormControl size="small" sx={{ width: 140 }}>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={sel.type} label="Type"
                                        onChange={e => updateSelector(idx, { type: e.target.value as ApproverSelectorType, userIds: [], departmentIds: [], roleIds: [] })}
                                    >
                                        <MenuItem value="USER">Specific Users</MenuItem>
                                        <MenuItem value="DEPARTMENT">Department</MenuItem>
                                        <MenuItem value="ROLE">Role</MenuItem>
                                        <MenuItem value="DEPT_ROLE">Dept + Role</MenuItem>
                                    </Select>
                                </FormControl>

                                {sel.type === 'USER' && (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Select Users</InputLabel>
                                        <Select
                                            multiple value={sel.userIds || []} label="Select Users"
                                            onChange={(e) => updateSelector(idx, { userIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map(uid => <Chip key={uid} size="small" label={users.find(u => u.id === uid)?.displayName || uid} />)}
                                                </Box>
                                            )}
                                        >
                                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.displayName}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )}

                                {sel.type === 'DEPARTMENT' && (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Select Departments</InputLabel>
                                        <Select
                                            multiple value={sel.departmentIds || []} label="Select Departments"
                                            onChange={(e) => updateSelector(idx, { departmentIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map(did => <Chip key={did} size="small" label={departments.find(d => d.id === did)?.name || did} />)}
                                                </Box>
                                            )}
                                        >
                                            {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )}

                                {sel.type === 'ROLE' && (
                                    <FormControl fullWidth size="small">
                                        <InputLabel>Select Roles</InputLabel>
                                        <Select
                                            multiple value={sel.roleIds || []} label="Select Roles"
                                            onChange={(e) => updateSelector(idx, { roleIds: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {(selected as string[]).map(rid => <Chip key={rid} size="small" label={roles.find(r => r.id === rid)?.name || rid} />)}
                                                </Box>
                                            )}
                                        >
                                            {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                )}

                                <IconButton size="small" color="error" onClick={() => removeSelector(idx)}><DeleteIcon /></IconButton>
                            </Stack>
                        </Paper>
                    ))}
                    <Button startIcon={<AddIcon />} size="small" onClick={addSelector}>Add Selector</Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

const ProcessBuilderPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { processes, updateProcess } = useProcessStore();
    const directory = useDirectoryStore();
    const importDirectory = useDirectoryStore(state => state.importDirectory);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await supabaseService.getDirectory();
                importDirectory(data);
            } catch (err) {
                console.error('Failed to load directory:', err);
            }
        };
        load();
    }, [importDirectory]);

    const process = processes.find(p => p.id === id);
    const [stages, setStages] = useState<Stage[]>(process?.stages || []);
    const [name, setName] = useState(process?.name || '');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setStages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleUpdateStage = (stageId: string, updates: Partial<Stage>) => {
        setStages(prev => prev.map(s => s.id === stageId ? { ...s, ...updates } : s));
    };

    const handleAddStage = () => {
        const newStage: Stage = {
            id: `stage_${Date.now()}`,
            name: `New Stage ${stages.length + 1}`,
            stageKey: `stage_${stages.length + 1}`,
            approverSelectors: [],
            approvalMode: 'ANY_ONE',
            order: stages.length
        };
        setStages([...stages, newStage]);
    };

    const handleDeleteStage = (stageId: string) => {
        setStages(prev => prev.filter(s => s.id !== stageId));
    };

    const handleSave = async () => {
        if (!process) return;
        const updatedProcess: Process = {
            ...process,
            name,
            stages,
            updatedAt: new Date().toISOString()
        };

        try {
            updateProcess(id!, updatedProcess);
            await supabaseService.saveProcess(updatedProcess);
            navigate('/processes');
        } catch (err: any) {
            console.error('Failed to sync process to Supabase:', err);
            // We still update local store, but navigate back or show error
            navigate('/processes');
        }
    };

    // RESOLUTION PREVIEW
    const resolvedApprovers = useMemo(() => {
        if (!process) return {};
        return resolveApprovers(
            { ...(process as Process), stages },
            directory,
            { requesterUserId: 'mock-requester' }
        );
    }, [stages, directory, process]);

    if (!process) return <Typography>Process not found</Typography>;

    return (
        <Box>
            <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: 'white', color: 'text.primary', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <Toolbar>
                    <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate('/processes')}><ArrowBackIcon /></IconButton>
                    <TextField
                        variant="standard" value={name} onChange={e => setName(e.target.value)}
                        sx={{ flexGrow: 1, '& .MuiInput-root': { fontSize: '1.25rem', fontWeight: 700 } }}
                    />
                    <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave}>Save Process</Button>
                </Toolbar>
            </AppBar>

            <Box sx={{ mt: 2, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                {/* Stages Editor */}
                <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Workflow Stages</Typography>
                        <Button startIcon={<AddIcon />} onClick={handleAddStage}>Add Stage</Button>
                    </Stack>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {stages.map(stage => (
                                <SortableStage
                                    key={stage.id} stage={stage}
                                    onEdit={handleUpdateStage} onDelete={handleDeleteStage}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </Box>

                {/* Resolution Preview Panel */}
                <Paper elevation={0} sx={{ width: 320, p: 3, border: '1px solid', borderColor: 'divider', position: 'sticky', top: 88, borderRadius: 3 }}>
                    <Typography variant="subtitle1" fontWeight="800" gutterBottom>Resolution Preview</Typography>
                    <Typography variant="caption" color="text.secondary" paragraph>
                        Shows resulting approver lists based on your current rules.
                    </Typography>

                    <Stack spacing={2} sx={{ mt: 2 }}>
                        {stages.map(stage => (
                            <Box key={stage.id}>
                                <Typography variant="caption" fontWeight="700" color="primary">{stage.name.toUpperCase()}</Typography>
                                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, bgcolor: 'background.default' }}>
                                    {resolvedApprovers[stage.stageKey]?.length ? (
                                        resolvedApprovers[stage.stageKey].map(uid => (
                                            <Box key={uid} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                <Typography variant="body2">{directory.users.find(u => u.id === uid)?.displayName || uid}</Typography>
                                            </Box>
                                        ))
                                    ) : (
                                        <Typography variant="caption" color="error">No approvers resolved</Typography>
                                    )}
                                </Paper>
                            </Box>
                        ))}
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
};

export default ProcessBuilderPage;
