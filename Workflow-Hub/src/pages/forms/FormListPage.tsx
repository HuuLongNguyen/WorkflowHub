
import React from 'react';
import {
    Box, Typography, Button, Grid, Card, CardContent,
    CardActions, Stack, IconButton, Paper, Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Description as FormIcon,
    Visibility as PreviewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useFormStore } from '../../store/formStore';
import { useProcessStore } from '../../store/processStore';
import { supabaseService } from '../../services/supabaseService';
import type { Form } from '../../types';

const FormListPage: React.FC = () => {
    const navigate = useNavigate();
    const forms = useFormStore(state => state.forms);
    const deleteForm = useFormStore(state => state.deleteForm);
    const addForm = useFormStore(state => state.addForm);
    const processes = useProcessStore(state => state.processes);

    const handleCreate = async () => {
        const id = uuidv4();
        const newForm: Form = {
            id,
            name: 'New Custom Form',
            version: 1,
            processId: processes[0]?.id || '', // Link to first process by default
            sections: [
                {
                    id: uuidv4(),
                    title: 'General Information',
                    fieldIds: []
                }
            ],
            fieldsById: {},
            updatedAt: new Date().toISOString()
        };
        addForm(newForm);

        try {
            await supabaseService.saveForm(newForm);
        } catch (err) {
            console.error('Failed to sync new form to Supabase:', err);
        }

        navigate(`/forms/${id}`);
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">Managed Forms</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
                    New Form
                </Button>
            </Stack>

            <Grid container spacing={3}>
                {forms.map((form) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={form.id}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                                    <FormIcon color="info" />
                                    <Typography variant="h6" fontWeight="700">{form.name}</Typography>
                                </Stack>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    Process: <b>{processes.find(p => p.id === form.processId)?.name || 'None linked'}</b>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sections: {form.sections.length}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Fields: {Object.keys(form.fieldsById).length}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'space-between', p: 2, bgcolor: 'action.hover' }}>
                                <Button size="small" startIcon={<PreviewIcon />} onClick={() => navigate(`/preview/${form.id}`)}>
                                    Preview
                                </Button>
                                <Stack direction="row">
                                    <Button size="small" startIcon={<EditIcon />} onClick={() => navigate(`/forms/${form.id}`)}>
                                        Edit
                                    </Button>
                                    <IconButton size="small" color="error" onClick={() => deleteForm(form.id)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {forms.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'action.hover', border: '1px dashed', borderColor: 'divider' }}>
                            <Typography color="text.secondary">No forms created yet. Click "New Form" to start designing.</Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default FormListPage;
