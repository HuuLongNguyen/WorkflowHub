
import React, { useState } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow,
    Chip, Stack, IconButton, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useTaskStore } from '../../store/taskStore';
import { useFormStore } from '../../store/formStore';
import { useProcessStore } from '../../store/processStore';
import { useDirectoryStore } from '../../store/directoryStore';
import type { Task, TaskStatus } from '../../types';
import { resolveApprovers } from '../../utils/rules';
import { supabaseService } from '../../services/supabaseService';

const TaskListPage: React.FC = () => {
    const navigate = useNavigate();
    const tasks = useTaskStore(state => state.tasks);
    const addTask = useTaskStore(state => state.addTask);
    const forms = useFormStore(state => state.forms);
    const processes = useProcessStore(state => state.processes);
    const { users, departments, roles } = useDirectoryStore();

    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedFormId, setSelectedFormId] = useState('');
    const [selectedRequesterId, setSelectedRequesterId] = useState(users[0]?.id || '');

    const handleCreateTask = async () => {
        const form = forms.find(f => f.id === selectedFormId);
        const process = processes.find(p => p.id === form?.processId);
        if (!form || !process) return;

        const requester = users.find(u => u.id === selectedRequesterId);

        // Initial resolution of approvers for the task
        const resolved = resolveApprovers(
            process,
            { users, departments, roles },
            { requesterUserId: selectedRequesterId, requesterDepartmentId: requester?.departmentId }
        );

        const taskId = uuidv4();
        const newTask: Task = {
            id: taskId,
            formId: selectedFormId,
            processId: process.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            requesterUserId: selectedRequesterId,
            currentStageKey: process.stages[0]?.stageKey || 'draft',
            status: 'DRAFT',
            resolvedApproversByStage: resolved,
            approvals: [],
            data: {}
        };

        addTask(newTask);

        try {
            await supabaseService.saveTask(newTask);
        } catch (err) {
            console.error('Failed to sync new task to Supabase:', err);
        }

        setCreateDialogOpen(false);
        navigate(`/tasks/${taskId}`);
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case 'DRAFT': return 'default';
            case 'IN_PROGRESS': return 'primary';
            case 'COMPLETED': return 'success';
            case 'REJECTED': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">Tasks & Workflow</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                    New Task
                </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Task ID</TableCell>
                            <TableCell>Form</TableCell>
                            <TableCell>Requester</TableCell>
                            <TableCell>Current Stage</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created At</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow key={task.id} hover onClick={() => navigate(`/tasks/${task.id}`)} sx={{ cursor: 'pointer' }}>
                                <TableCell><Typography variant="body2" fontWeight="700">{task.id.split('_')[1]}</Typography></TableCell>
                                <TableCell>{forms.find(f => f.id === task.formId)?.name || 'Unknown'}</TableCell>
                                <TableCell>{users.find(u => u.id === task.requesterUserId)?.displayName || 'Unknown'}</TableCell>
                                <TableCell>
                                    <Chip size="small" variant="outlined" label={task.currentStageKey.toUpperCase()} />
                                </TableCell>
                                <TableCell>
                                    <Chip size="small" color={getStatusColor(task.status)} label={task.status} />
                                </TableCell>
                                <TableCell>{new Date(task.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell align="right">
                                    <IconButton size="small"><ChevronRightIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {tasks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">No tasks found. Create one to start a workflow.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create Task Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Initiate New Task</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Select Form Template</InputLabel>
                            <Select value={selectedFormId} label="Select Form Template" onChange={e => setSelectedFormId(e.target.value)}>
                                {forms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel>Requesting As User</InputLabel>
                            <Select value={selectedRequesterId} label="Requesting As User" onChange={e => setSelectedRequesterId(e.target.value)}>
                                {users.map(u => <MenuItem key={u.id} value={u.id}>{u.displayName}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateTask} disabled={!selectedFormId}>Create Task</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TaskListPage;
