
import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Stack } from '@mui/material';
import {
    People as PeopleIcon,
    AccountTree as ProcessIcon,
    Description as FormIcon,
    Assignment as TaskIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDirectoryStore } from '../store/directoryStore';
import { useProcessStore } from '../store/processStore';
import { useFormStore } from '../store/formStore';
import { useTaskStore } from '../store/taskStore';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const users = useDirectoryStore(state => state.users);
    const processes = useProcessStore(state => state.processes);
    const forms = useFormStore(state => state.forms);
    const tasks = useTaskStore(state => state.tasks);

    const stats = [
        { label: 'Directory Users', count: users.length, icon: <PeopleIcon color="primary" />, path: '/directory' },
        { label: 'Active Processes', count: processes.length, icon: <ProcessIcon color="secondary" />, path: '/processes' },
        { label: 'Managed Forms', count: forms.length, icon: <FormIcon color="info" />, path: '/forms' },
        { label: 'Total Tasks', count: tasks.length, icon: <TaskIcon color="success" />, path: '/tasks' },
    ];

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4 }}>System Overview</Typography>

            <Grid container spacing={3}>
                {stats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                        <Card sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                        }} onClick={() => navigate(stat.path)}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography color="text.secondary" variant="overline" fontWeight="700">
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h3" fontWeight="800">
                                            {stat.count}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 3 }}>
                                        {stat.icon}
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Typography variant="h5" sx={{ mt: 6, mb: 3 }}>Quick Start</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>How it works</Typography>
                            <Stack spacing={2}>
                                <Typography variant="body2">• 1. Populate the <b>Directory</b> with users, departments, and roles.</Typography>
                                <Typography variant="body2">• 2. Design a <b>Process</b> with stages and dynamic approver rules.</Typography>
                                <Typography variant="body2">• 3. Create a <b>Form</b> layout and link it to your process.</Typography>
                                <Typography variant="body2">• 4. Launch <b>Tasks</b> that automatically route through your workflow.</Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;
