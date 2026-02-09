
import React from 'react';
import {
    Box, Typography, Button, Grid, Card, CardContent,
    CardActions, Chip, Stack, IconButton, Paper
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    AccountTree as ProcessIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useProcessStore } from '../../store/processStore';
import type { Process } from '../../types';

const ProcessListPage: React.FC = () => {
    const navigate = useNavigate();
    const { processes, addProcess, deleteProcess } = useProcessStore();

    const handleCreate = () => {
        const id = uuidv4();
        const newProcess: Process = {
            id,
            name: 'New Workflow Process',
            version: 1,
            stages: [
                {
                    id: `stage_1`,
                    name: 'Draft',
                    stageKey: 'draft',
                    approverSelectors: [],
                    approvalMode: 'ANY_ONE',
                    order: 0
                }
            ],
            updatedAt: new Date().toISOString()
        };
        addProcess(newProcess);
        navigate(`/processes/${id}`);
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">Workflow Processes</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    Design Process
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {processes.map((proc) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={proc.id}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                    <ProcessIcon color="primary" />
                                    <Typography variant="h6" fontWeight="700">{proc.name}</Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Stages: {proc.stages.length}
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
                                    {proc.stages.map(s => (
                                        <Chip key={s.id} label={s.name} size="small" variant="outlined" />
                                    ))}
                                </Stack>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'flex-end', p: 2, bgcolor: 'action.hover' }}>
                                <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/processes/${proc.id}`)}>
                                    Build
                                </Button>
                                <IconButton size="small" color="error" onClick={() => deleteProcess(proc.id)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {processes.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                            <Typography color="text.secondary">No processes designed yet. Click "Design Process" to start.</Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default ProcessListPage;
