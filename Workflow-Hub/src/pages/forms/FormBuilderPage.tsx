import React, { useState } from 'react';
import {
    Box, Typography, Button, Stack, Paper, TextField, Divider,
    IconButton, AppBar, Toolbar, FormControl, InputLabel, Select, MenuItem,
    Grid, Card, CardHeader, CardContent, Menu, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableHead, TableRow, TableCell, TableBody,
    Checkbox, FormControlLabel
} from '@mui/material';
import {
    Save as SaveIcon,
    ArrowBack as ArrowBackIcon,
    PlaylistAdd as SectionIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Settings as SettingsIcon,
    TextFields as TextIcon,
    Numbers as NumberIcon,
    CalendarToday as DateIcon,
    List as SelectIcon,
    CheckBox as CheckboxIcon,
    RadioButtonChecked as RadioIcon,
    People as PeopleIcon,
    AttachFile as FileIcon,
    Visibility as VisibleIcon,
    Edit as EditIcon,
    CheckCircle as RequiredIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFormStore } from '../../store/formStore';
import { useProcessStore } from '../../store/processStore';
import { supabaseService } from '../../services/supabaseService';
import type { Form, Section, Field, FieldType, FieldStageRule } from '../../types';

const FormBuilderPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const forms = useFormStore(state => state.forms);
    const updateForm = useFormStore(state => state.updateForm);
    const processes = useProcessStore(state => state.processes);

    const initialForm = forms.find(f => f.id === id);
    const [formName, setFormName] = useState(initialForm?.name || '');
    const [processId, setProcessId] = useState(initialForm?.processId || '');
    const [sections, setSections] = useState<Section[]>(initialForm?.sections || []);
    const [fieldsById, setFieldsById] = useState<Record<string, Field>>(initialForm?.fieldsById || {});

    // Editor State
    const [anchorEl, setAnchorEl] = useState<{ el: HTMLElement, sectionId: string, columnId: string } | null>(null);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

    if (!initialForm) return <Typography>Form not found</Typography>;

    const selectedProcess = processes.find(p => p.id === processId);
    const editingField = editingFieldId ? fieldsById[editingFieldId] : null;

    const handleSave = async () => {
        const updatedForm: Form = {
            ...initialForm,
            name: formName,
            processId,
            sections,
            fieldsById,
            updatedAt: new Date().toISOString()
        };

        try {
            updateForm(initialForm.id, updatedForm);
            await supabaseService.saveForm(updatedForm);
            navigate('/forms');
        } catch (err: any) {
            console.error('Failed to sync form to Supabase:', err);
            navigate('/forms');
        }
    };

    const handleAddSection = () => {
        const newSection: Section = {
            id: uuidv4(),
            title: `New Section ${sections.length + 1}`,
            columns: [{ id: uuidv4(), width: 100, fieldIds: [] }]
        };
        setSections([...sections, newSection]);
    };

    const handleDeleteSection = (sectionId: string) => {
        setSections(sections.filter(s => s.id !== sectionId));
    };

    const handleAddField = (type: FieldType, sectionId: string, columnId: string) => {
        const fieldId = uuidv4();
        const newField: Field = {
            id: fieldId,
            key: `field_${Object.keys(fieldsById).length + 1}`,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            type,
            requiredDefault: false,
            rulesByStage: {}
        };

        setFieldsById({ ...fieldsById, [fieldId]: newField });

        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                columns: s.columns.map(c => {
                    if (c.id !== columnId) return c;
                    return { ...c, fieldIds: [...c.fieldIds, fieldId] };
                })
            };
        }));
        setAnchorEl(null);
    };

    const handleDeleteField = (fieldId: string, sectionId: string, columnId: string) => {
        setSections(sections.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                columns: s.columns.map(c => {
                    if (c.id !== columnId) return c;
                    return { ...c, fieldIds: c.fieldIds.filter(id => id !== fieldId) };
                })
            };
        }));
        // Note: Field remains in fieldsById to avoid data loss if removed from column but referenced elsewhere, 
        // though in this simple impl we could delete it.
    };

    const updateFieldRule = (stageKey: string, updates: Partial<FieldStageRule>) => {
        if (!editingFieldId) return;
        const field = fieldsById[editingFieldId];
        const currentRule = field.rulesByStage[stageKey] || { visible: 'INHERIT', editable: 'INHERIT', required: 'INHERIT' };

        setFieldsById({
            ...fieldsById,
            [editingFieldId]: {
                ...field,
                rulesByStage: {
                    ...field.rulesByStage,
                    [stageKey]: { ...currentRule, ...updates }
                }
            }
        });
    };

    const fieldIcons: Record<string, any> = {
        text: <TextIcon fontSize="small" />,
        number: <NumberIcon fontSize="small" />,
        date: <DateIcon fontSize="small" />,
        select: <SelectIcon fontSize="small" />,
        checkbox: <CheckboxIcon fontSize="small" />,
        radio: <RadioIcon fontSize="small" />,
        people: <PeopleIcon fontSize="small" />,
        attachment: <FileIcon fontSize="small" />
    };

    return (
        <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column' }}>
            <AppBar position="fixed" sx={{ zIndex: 1201, bgcolor: 'white', color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                <Toolbar>
                    <IconButton edge="start" component={Link} to="/forms" sx={{ mr: 2 }}><ArrowBackIcon /></IconButton>
                    <TextField
                        variant="standard" value={formName} onChange={e => setFormName(e.target.value)}
                        sx={{ flexGrow: 1, '& .MuiInput-root': { fontSize: '1.25rem', fontWeight: 700 } }}
                    />
                    <Stack direction="row" spacing={2} alignItems="center">
                        <FormControl sx={{ minWidth: 200 }} size="small">
                            <InputLabel>Linked Process</InputLabel>
                            <Select value={processId} label="Linked Process" onChange={e => setProcessId(e.target.value)}>
                                <MenuItem value="">None</MenuItem>
                                {processes.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Button startIcon={<SaveIcon />} variant="contained" onClick={handleSave}>Save Changes</Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box sx={{ mt: 2, flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Panel */}
                <Paper sx={{ width: 280, p: 2, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box>
                        <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom>PALETTE</Typography>
                        <Typography variant="caption" color="text.secondary" paragraph>Click "Add" in a column to place these</Typography>
                        <Grid container spacing={1}>
                            {["text", "number", "date", "select", "checkbox", "radio", "people", "attachment"].map(type => (
                                <Grid size={{ xs: 6 }} key={type}>
                                    <Paper
                                        variant="outlined"
                                        sx={{ p: 1, textAlign: 'center', bgcolor: 'background.default', opacity: 0.8 }}
                                    >
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            {fieldIcons[type]}
                                            <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 700 }}>{type.toUpperCase()}</Typography>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                    <Divider />
                    <Box>
                        <Typography variant="subtitle2" fontWeight="800" color="text.secondary" gutterBottom>ACTIONS</Typography>
                        <Button fullWidth variant="contained" startIcon={<SectionIcon />} onClick={handleAddSection} sx={{ mb: 1 }}>
                            Add Section
                        </Button>
                    </Box>
                </Paper>

                {/* Main Canvas */}
                <Box sx={{ flexGrow: 1, p: 4, overflowY: 'auto', bgcolor: 'grey.50' }}>
                    <Paper sx={{ maxWidth: 900, mx: 'auto', p: 4, minHeight: '100%', borderRadius: 2 }}>
                        <Typography variant="h5" align="center" gutterBottom fontWeight="900" sx={{ mb: 4 }}>{formName || 'Untitled Form'}</Typography>

                        <Stack spacing={4}>
                            {sections.map(section => (
                                <Card key={section.id} variant="outlined" sx={{ position: 'relative', '&:hover .section-actions': { opacity: 1 } }}>
                                    <CardHeader
                                        title={<TextField fullWidth size="small" value={section.title} onChange={e => {
                                            setSections(sections.map(s => s.id === section.id ? { ...s, title: e.target.value } : s));
                                        }} sx={{ '& .MuiInputBase-input': { fontWeight: 700 } }} />}
                                        action={
                                            <IconButton color="error" size="small" onClick={() => handleDeleteSection(section.id)} className="section-actions" sx={{ opacity: 0.3, transition: '0.2s' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                        sx={{ bgcolor: 'action.hover', py: 1 }}
                                    />
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            {section.columns.map(column => (
                                                <Grid size={{ xs: 12 }} key={column.id}>
                                                    <Stack spacing={2}>
                                                        {column.fieldIds.map(fid => {
                                                            const field = fieldsById[fid];
                                                            if (!field) return null;
                                                            return (
                                                                <Paper key={fid} variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                        {fieldIcons[field.type]}
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight="700">{field.label}</Typography>
                                                                            <Typography variant="caption" color="text.secondary">{field.type} • {field.key}</Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <Stack direction="row" spacing={1}>
                                                                        <IconButton size="small" onClick={() => setEditingFieldId(fid)}><SettingsIcon fontSize="inherit" /></IconButton>
                                                                        <IconButton size="small" color="error" onClick={() => handleDeleteField(fid, section.id, column.id)}><DeleteIcon fontSize="inherit" /></IconButton>
                                                                    </Stack>
                                                                </Paper>
                                                            );
                                                        })}
                                                        <Button
                                                            fullWidth variant="outlined"
                                                            startIcon={<AddIcon />}
                                                            onClick={(e) => setAnchorEl({ el: e.currentTarget, sectionId: section.id, columnId: column.id })}
                                                            sx={{ border: '1px dashed', borderColor: 'divider', py: 1.5 }}
                                                        >
                                                            Add Field
                                                        </Button>
                                                    </Stack>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ))}
                        </Stack>

                        {sections.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                                <SectionIcon sx={{ fontSize: 48, mb: 2 }} />
                                <Typography>No sections yet. Click "Add Section" to begin.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* Field Type Selection Menu */}
            <Menu
                anchorEl={anchorEl?.el}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
            >
                {["text", "number", "date", "select", "checkbox", "radio", "people", "attachment"].map(type => (
                    <MenuItem key={type} onClick={() => anchorEl && handleAddField(type as FieldType, anchorEl.sectionId, anchorEl.columnId)}>
                        <ListItemIcon sx={{ minWidth: 36 }}>{fieldIcons[type]}</ListItemIcon>
                        <ListItemText sx={{ '& .MuiTypography-root': { textTransform: 'capitalize' } }}>{type}</ListItemText>
                    </MenuItem>
                ))}
            </Menu>

            {/* Field Settings Dialog */}
            <Dialog open={!!editingFieldId} onClose={() => setEditingFieldId(null)} fullWidth maxWidth="md">
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SettingsIcon />
                    Field Settings: {editingField?.label}
                </DialogTitle>
                <DialogContent dividers>
                    {editingField && (
                        <Stack spacing={3}>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth label="Field Label" size="small"
                                        value={editingField.label}
                                        onChange={e => setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, label: e.target.value } })}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <TextField
                                        fullWidth label="Technical Key" size="small"
                                        value={editingField.key}
                                        onChange={e => setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, key: e.target.value } })}
                                    />
                                </Grid>
                            </Grid>

                            {/* Default Value Settings */}
                            {(editingField.type === 'checkbox' || editingField.type === 'date') && (
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom fontWeight="700">Default Value</Typography>
                                    {editingField.type === 'checkbox' ? (
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={!!editingField.defaultValue}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, defaultValue: e.target.checked } })}
                                                />
                                            }
                                            label="Checked by default"
                                        />
                                    ) : (
                                        <TextField
                                            type="date" size="small"
                                            value={editingField.defaultValue || ''}
                                            onChange={e => setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, defaultValue: e.target.value } })}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    )}
                                </Box>
                            )}

                            {/* Options Editor for Select/Radio */}
                            {(editingField.type === 'select' || editingField.type === 'radio') && (
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight="700">Options</Typography>
                                        <Button
                                            size="small" startIcon={<AddIcon />}
                                            onClick={() => {
                                                const newOption = { id: uuidv4(), label: `Option ${(editingField.options?.length || 0) + 1}`, value: `val_${(editingField.options?.length || 0) + 1}` };
                                                setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, options: [...(editingField.options || []), newOption] } });
                                            }}
                                        >
                                            Add Option
                                        </Button>
                                    </Stack>
                                    <Stack spacing={1}>
                                        {(editingField.options || []).map((opt, index) => (
                                            <Stack key={opt.id} direction="row" spacing={1}>
                                                <TextField
                                                    label="Label" size="small" value={opt.label}
                                                    onChange={e => {
                                                        const newOpts = [...(editingField.options || [])];
                                                        newOpts[index] = { ...opt, label: e.target.value };
                                                        setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, options: newOpts } });
                                                    }}
                                                />
                                                <TextField
                                                    label="Value" size="small" value={opt.value}
                                                    onChange={e => {
                                                        const newOpts = [...(editingField.options || [])];
                                                        newOpts[index] = { ...opt, value: e.target.value };
                                                        setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, options: newOpts } });
                                                    }}
                                                />
                                                <IconButton
                                                    size="small" color="error"
                                                    onClick={() => {
                                                        const newOpts = (editingField.options || []).filter(o => o.id !== opt.id);
                                                        setFieldsById({ ...fieldsById, [editingField.id]: { ...editingField, options: newOpts } });
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="subtitle2" gutterBottom fontWeight="700">Stage-Specific Rules</Typography>
                                <Typography variant="caption" color="text.secondary" paragraph>
                                    Configure how this field behaves at each workflow stage. Use "Inherit" to follow defaults.
                                </Typography>

                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                                <TableCell sx={{ fontWeight: 700 }}>Stage</TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}><Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center"><VisibleIcon sx={{ fontSize: 16 }} /> VISIBILITY</Stack></TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}><Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center"><EditIcon sx={{ fontSize: 16 }} /> EDITABILITY</Stack></TableCell>
                                                <TableCell align="center" sx={{ fontWeight: 700 }}><Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center"><RequiredIcon sx={{ fontSize: 16 }} /> REQUIREMENT</Stack></TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {selectedProcess?.stages.map(stage => {
                                                const rule = editingField.rulesByStage[stage.stageKey] || { visible: 'INHERIT', editable: 'INHERIT', required: 'INHERIT' };
                                                return (
                                                    <TableRow key={stage.id}>
                                                        <TableCell sx={{ fontWeight: 600 }}>{stage.name}</TableCell>
                                                        <TableCell align="center">
                                                            <Select
                                                                size="small" value={rule.visible}
                                                                onChange={e => updateFieldRule(stage.stageKey, { visible: e.target.value as any })}
                                                                sx={{ fontSize: '0.75rem', minWidth: 100 }}
                                                            >
                                                                <MenuItem value="INHERIT">Inherit</MenuItem>
                                                                <MenuItem value="SHOW">Always Show</MenuItem>
                                                                <MenuItem value="HIDE">Hide</MenuItem>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Select
                                                                size="small" value={rule.editable}
                                                                onChange={e => updateFieldRule(stage.stageKey, { editable: e.target.value as any })}
                                                                sx={{ fontSize: '0.75rem', minWidth: 100 }}
                                                            >
                                                                <MenuItem value="INHERIT">Inherit</MenuItem>
                                                                <MenuItem value="EDITABLE">Editable</MenuItem>
                                                                <MenuItem value="READONLY">Read-only</MenuItem>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Select
                                                                size="small" value={rule.required}
                                                                onChange={e => updateFieldRule(stage.stageKey, { required: e.target.value as any })}
                                                                sx={{ fontSize: '0.75rem', minWidth: 100 }}
                                                            >
                                                                <MenuItem value="INHERIT">Inherit</MenuItem>
                                                                <MenuItem value="REQUIRED">Required</MenuItem>
                                                                <MenuItem value="OPTIONAL">Optional</MenuItem>
                                                            </Select>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {!selectedProcess && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 2 }}>
                                                        <Typography variant="caption" color="text.secondary">Please link a process to configure stage-specific rules.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingFieldId(null)} variant="outlined">Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

// Simple helper components used above
const ListItemIcon = ({ children, sx }: any) => <Box sx={sx}>{children}</Box>;
const ListItemText = ({ children, sx }: any) => <Box sx={sx}>{children}</Box>;
const TableContainer = ({ children, component, variant }: any) => <Box component={component} sx={{ border: variant === 'outlined' ? '1px solid' : 'none', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>{children}</Box>;

export default FormBuilderPage;
