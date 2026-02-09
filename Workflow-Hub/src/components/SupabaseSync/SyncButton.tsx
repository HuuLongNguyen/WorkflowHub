import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Snackbar, Box } from '@mui/material';
import { CloudUpload, CloudDownload } from '@mui/icons-material';
import { supabaseService } from '../../services/supabaseService';
import { useTaskStore } from '../../store/taskStore';
import { useProcessStore } from '../../store/processStore';
import { useFormStore } from '../../store/formStore';
import { useDirectoryStore } from '../../store/directoryStore';

const SyncButton: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: 'success' as 'success' | 'error' });
    const [open, setOpen] = useState(false);

    const taskStore = useTaskStore();
    const processStore = useProcessStore();
    const formStore = useFormStore();
    const directoryStore = useDirectoryStore();

    const handlePush = async () => {
        setLoading(true);
        try {
            // Push all tasks
            await Promise.all(taskStore.tasks.map(t => supabaseService.saveTask(t)));
            // Push all processes
            await Promise.all(processStore.processes.map(p => supabaseService.saveProcess(p)));
            // Push all forms
            await Promise.all(formStore.forms.map(f => supabaseService.saveForm(f)));

            setMsg({ text: 'Data pushed to Supabase successfully!', type: 'success' });
        } catch (err: any) {
            setMsg({ text: `Push failed: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
            setOpen(true);
        }
    };

    const handlePull = async () => {
        setLoading(true);
        try {
            const [tasks, processes, forms, directory] = await Promise.all([
                supabaseService.getTasks(),
                supabaseService.getProcesses(),
                supabaseService.getForms(),
                supabaseService.getDirectory(),
            ]);

            taskStore.importTasks(tasks);
            processStore.importProcesses(processes);
            formStore.importForms(forms);
            directoryStore.importDirectory(directory);

            setMsg({ text: 'Data pulled from Supabase successfully!', type: 'success' });
        } catch (err: any) {
            setMsg({ text: `Pull failed: ${err.message}`, type: 'error' });
        } finally {
            setLoading(false);
            setOpen(true);
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                onClick={handlePush}
                disabled={loading}
            >
                Push to Cloud
            </Button>
            <Button
                variant="outlined"
                startIcon={loading ? <CircularProgress size={20} /> : <CloudDownload />}
                onClick={handlePull}
                disabled={loading}
            >
                Pull from Cloud
            </Button>

            <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
                <Alert onClose={() => setOpen(false)} severity={msg.type} sx={{ width: '100%' }}>
                    {msg.text}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SyncButton;
