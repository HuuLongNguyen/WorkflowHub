
import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Stack, Button,
    Divider, Chip, Alert, FormControl, InputLabel, Select, MenuItem,
    Stepper, Step, StepLabel, AppBar, Toolbar, IconButton, List, ListItem, ListItemText
} from '@mui/material';
import {
    Close as RejectIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../store/taskStore';
import { useFormStore } from '../../store/formStore';
import { useProcessStore } from '../../store/processStore';
import { useDirectoryStore } from '../../store/directoryStore';
import { FormRenderer } from '../../components/FormRenderer/FormRenderer';
import { supabaseService } from '../../services/supabaseService';

const TaskDetailsPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tasks, updateTask, addApproval } = useTaskStore();
    const forms = useFormStore(state => state.forms);
    const processes = useProcessStore(state => state.processes);
    const { users } = useDirectoryStore();

    const task = tasks.find(t => t.id === id);
    const form = forms.find(f => f.id === task?.formId);
    const process = processes.find(p => p.id === task?.processId);

    const [actingAsId, setActingAsId] = useState(users[0]?.id || '');

    if (!task || !form || !process) return <Typography>Task not found</Typography>;

    const currentStageIndex = process.stages.findIndex(s => s.stageKey === task.currentStageKey);
    const isApprover = task.resolvedApproversByStage[task.currentStageKey]?.includes(actingAsId);

    const handleAction = async (data: any, action: 'APPROVE' | 'REJECT' | 'SUBMIT') => {
        const nextStage = process.stages[currentStageIndex + 1];
        let updatedTask = { ...task };

        if (action === 'SUBMIT') {
            updatedTask = {
                ...task,
                data,
                currentStageKey: nextStage?.stageKey || task.currentStageKey,
                status: nextStage ? 'IN_PROGRESS' as const : 'COMPLETED' as const,
                updatedAt: new Date().toISOString()
            };
            updateTask(task.id, updatedTask);
        } else if (action === 'APPROVE') {
            const approval = {
                stageKey: task.currentStageKey,
                action: 'APPROVE' as const,
                actedByUserId: actingAsId,
                actedAt: new Date().toISOString()
            };
            addApproval(task.id, approval);

            updatedTask = {
                ...task,
                approvals: [...task.approvals, approval],
                currentStageKey: nextStage?.stageKey || task.currentStageKey,
                status: nextStage ? 'IN_PROGRESS' as const : 'COMPLETED' as const,
                updatedAt: new Date().toISOString()
            };
            updateTask(task.id, updatedTask);
        } else if (action === 'REJECT') {
            const approval = {
                stageKey: task.currentStageKey,
                action: 'REJECT' as const,
                actedByUserId: actingAsId,
                actedAt: new Date().toISOString()
            };
            addApproval(task.id, approval);

            updatedTask = {
                ...task,
                approvals: [...task.approvals, approval],
                status: 'REJECTED' as const,
                updatedAt: new Date().toISOString()
            };
            updateTask(task.id, updatedTask);
        }

        try {
            await supabaseService.saveTask(updatedTask);
        } catch (err) {
            console.error('Failed to sync task to Supabase:', err);
        }
    };

    return (
        <Box>
            <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: 'white', color: 'text.primary', boxShadow: 'none', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Toolbar>
                    <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate('/tasks')}><ArrowBackIcon /></IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                        Task: {form.name} (#{task.id.split('_')[1]})
                    </Typography>
                    <FormControl sx={{ minWidth: 180 }} size="small">
                        <InputLabel>Simulate User</InputLabel>
                        <Select value={actingAsId} label="Simulate User" onChange={e => setActingAsId(e.target.value)}>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.displayName}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Toolbar>
            </AppBar>

            <Box sx={{ mt: 2 }}>
                <Stepper activeStep={currentStageIndex} alternativeLabel sx={{ mb: 6 }}>
                    {process.stages.map((stage) => (
                        <Step key={stage.id}>
                            <StepLabel>{stage.name}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        {task.status === 'COMPLETED' || task.status === 'REJECTED' ? (
                            <Alert severity={task.status === 'COMPLETED' ? "success" : "error"} sx={{ mb: 3 }}>
                                Workflow is <b>{task.status}</b>. Form is now read-only.
                            </Alert>
                        ) : null}

                        <FormRenderer
                            form={form}
                            stageKey={task.currentStageKey}
                            actorUserId={actingAsId}
                            resolvedApprovers={task.resolvedApproversByStage}
                            initialData={task.data}
                            readOnly={task.status === 'COMPLETED' || task.status === 'REJECTED'}
                            onSubmit={(data) => {
                                if (task.status === 'DRAFT') handleAction(data, 'SUBMIT');
                                else if (isApprover) handleAction(data, 'APPROVE');
                            }}
                        />

                        {isApprover && task.status !== 'COMPLETED' && task.status !== 'REJECTED' && (
                            <Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined" color="error"
                                    startIcon={<RejectIcon />}
                                    onClick={() => handleAction({}, 'REJECT')}
                                >
                                    Reject Task
                                </Button>
                            </Stack>
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Stack spacing={3}>
                            <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight="800">AUDIT TRAIL</Typography>
                                <Divider sx={{ mb: 2 }} />
                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="Initiated"
                                            secondary={`${new Date(task.createdAt).toLocaleString()} by ${users.find(u => u.id === task.requesterUserId)?.displayName}`}
                                        />
                                    </ListItem>
                                    {task.approvals.map((app, idx) => (
                                        <ListItem key={idx}>
                                            <ListItemText
                                                primary={app.action === 'APPROVE' ? 'Approved' : 'Rejected'}
                                                secondary={`${new Date(app.actedAt).toLocaleString()} at ${app.stageKey} by ${users.find(u => u.id === app.actedByUserId)?.displayName}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </Paper>

                            <Paper sx={{ p: 3, bgcolor: 'background.default' }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight="800">STAGE INFO</Typography>
                                <Typography variant="body2" gutterBottom><b>Current:</b> {task.currentStageKey}</Typography>
                                <Typography variant="body2"><b>Required Approvers:</b></Typography>
                                <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap">
                                    {task.resolvedApproversByStage[task.currentStageKey]?.map(uid => (
                                        <Chip key={uid} size="small" label={users.find(u => u.id === uid)?.displayName || uid} />
                                    ))}
                                </Stack>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default TaskDetailsPage;
