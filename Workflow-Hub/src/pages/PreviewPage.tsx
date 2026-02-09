
import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Stack, FormControl,
    InputLabel, Select, MenuItem, Divider, Chip, Alert, Grid
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useFormStore } from '../store/formStore';
import { useProcessStore } from '../store/processStore';
import { useDirectoryStore } from '../store/directoryStore';
import { FormRenderer } from '../components/FormRenderer/FormRenderer';
import { resolveApprovers } from '../utils/rules';

const PreviewPage: React.FC = () => {
    const { formId } = useParams();
    const forms = useFormStore(state => state.forms);
    const processes = useProcessStore(state => state.processes);
    const { users, departments, roles } = useDirectoryStore();

    const form = forms.find(f => f.id === formId);
    const process = processes.find(p => p.id === form?.processId);

    const [simActorId, setSimActorId] = useState(users[0]?.id || '');
    const [simStageKey, setSimStageKey] = useState(process?.stages[0]?.stageKey || '');

    const resolved = useMemo(() => {
        if (!process) return {};
        return resolveApprovers(process, { users, departments, roles }, { requesterUserId: simActorId });
    }, [process, users, departments, roles, simActorId]);

    if (!form || !process) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5">Form or Process not found</Typography>
                <Typography color="text.secondary">Make sure your form is linked to a valid process.</Typography>
            </Box>
        );
    }

    const actor = users.find(u => u.id === simActorId);
    const isApprover = resolved[simStageKey]?.includes(simActorId);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Form Preview & Simulation</Typography>

            <Paper sx={{ p: 3, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ opacity: 0.8, fontWeight: 700 }}>SIMULATION CONTEXT</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                    <FormControl sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }} size="small">
                        <InputLabel>Acting As User</InputLabel>
                        <Select value={simActorId} label="Acting As User" onChange={e => setSimActorId(e.target.value)}>
                            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.displayName} ({u.email})</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }} size="small">
                        <InputLabel>Current Stage</InputLabel>
                        <Select value={simStageKey} label="Current Stage" onChange={e => setSimStageKey(e.target.value)}>
                            {process.stages.map(s => <MenuItem key={s.stageKey} value={s.stageKey}>{s.name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />

                    <Box>
                        <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>Resolved Approvers for this Stage:</Typography>
                        <Stack direction="row" spacing={0.5} mt={0.5}>
                            {resolved[simStageKey]?.map(uid => (
                                <Chip
                                    key={uid} size="small"
                                    label={users.find(u => u.id === uid)?.displayName || uid}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                />
                            ))}
                            {!resolved[simStageKey]?.length && <Typography variant="caption">None</Typography>}
                        </Stack>
                    </Box>
                </Stack>
            </Paper>

            <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <FormRenderer
                        form={form}
                        stageKey={simStageKey}
                        actorUserId={simActorId}
                        resolvedApprovers={resolved}
                        onSubmit={(data) => alert('Simulation Submit: ' + JSON.stringify(data, null, 2))}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Typography variant="h6" gutterBottom>Intelligence Log</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Stack spacing={2}>
                            <Alert severity={isApprover ? "success" : "info"}>
                                User <b>{actor?.displayName}</b> {isApprover ? "IS" : "is NOT"} an approver for <b>{simStageKey}</b>.
                            </Alert>
                            <Box>
                                <Typography variant="subtitle2">Actor Attributes:</Typography>
                                <Typography variant="body2">Dept: {departments.find(d => d.id === actor?.departmentId)?.name || 'N/A'}</Typography>
                                <Typography variant="body2">Roles: {actor?.roleIds.map(rid => roles.find(r => r.id === rid)?.name).join(', ') || 'None'}</Typography>
                            </Box>
                            <Divider />
                            <Typography variant="caption" color="text.secondary">
                                Rule evaluation is live. Change the actor or stage to see how fields appear, disappear, or become read-only.
                            </Typography>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PreviewPage;
