
import React, { useState } from 'react';
import {
    Drawer, Box, Typography, TextField, Stack,
    Button, IconButton, Select,
    MenuItem, FormControlLabel, Checkbox, Tabs, Tab,
    Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { Close as CloseIcon, Save as SaveIcon } from '@mui/icons-material';
import type { Field, Stage, FieldStageRule } from '../../types';

interface FieldPropertyEditorProps {
    open: boolean;
    onClose: () => void;
    field: Field | null;
    stages: Stage[];
    onSave: (updatedField: Field) => void;
}

export const FieldPropertyEditor: React.FC<FieldPropertyEditorProps> = ({
    open, onClose, field, stages, onSave
}) => {
    const [tab, setTab] = useState(0);
    const [localField, setLocalField] = useState<Field | null>(null);

    React.useEffect(() => {
        if (field) setLocalField({ ...field });
    }, [field]);

    if (!localField) return null;

    const updateField = (updates: Partial<Field>) => {
        setLocalField({ ...localField, ...updates });
    };

    const updateRule = (stageKey: string, updates: Partial<FieldStageRule>) => {
        const rules = { ...localField.rulesByStage };
        rules[stageKey] = {
            ...(rules[stageKey] || { visible: "INHERIT", editable: "INHERIT", required: "INHERIT" }),
            ...updates
        };
        updateField({ rulesByStage: rules });
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 500 } }}>
            <Box sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Edit Field: {localField.label}</Typography>
                    <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Stack>

                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
                    <Tab label="General" />
                    <Tab label="Stage Rules" />
                </Tabs>

                {tab === 0 && (
                    <Stack spacing={3}>
                        <TextField
                            fullWidth label="Label" value={localField.label}
                            onChange={e => updateField({ label: e.target.value })}
                        />
                        <TextField
                            fullWidth label="Field Key" value={localField.key}
                            onChange={e => updateField({ key: e.target.value })}
                        />
                        <TextField
                            fullWidth label="Help Text" value={localField?.helpText || ''}
                            onChange={e => updateField({ helpText: e.target.value })}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={localField.requiredDefault} onChange={e => updateField({ requiredDefault: e.target.checked })} />}
                            label="Required by Default"
                        />
                    </Stack>
                )}

                {tab === 1 && (
                    <Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Override behavior for each stage in the linked process.
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Stage</TableCell>
                                    <TableCell>Visible</TableCell>
                                    <TableCell>Editable</TableCell>
                                    <TableCell>Req.</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stages.map(stage => {
                                    const rule = localField.rulesByStage[stage.stageKey] || { visible: "INHERIT", editable: "INHERIT", required: "INHERIT" };
                                    return (
                                        <TableRow key={stage.id}>
                                            <TableCell><Typography variant="caption" fontWeight="700">{stage.name}</Typography></TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small" value={rule.visible} sx={{ fontSize: '0.75rem' }}
                                                    onChange={e => updateRule(stage.stageKey, { visible: e.target.value as any })}
                                                >
                                                    <MenuItem value="INHERIT">Inherit</MenuItem>
                                                    <MenuItem value="SHOW">Show</MenuItem>
                                                    <MenuItem value="HIDE">Hide</MenuItem>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small" value={rule.editable} sx={{ fontSize: '0.75rem' }}
                                                    onChange={e => updateRule(stage.stageKey, { editable: e.target.value as any })}
                                                >
                                                    <MenuItem value="INHERIT">Inherit</MenuItem>
                                                    <MenuItem value="EDITABLE">Editable</MenuItem>
                                                    <MenuItem value="READONLY">Read-only</MenuItem>
                                                </Select>
                                                <FormControlLabel
                                                    control={<Checkbox size="small" checked={!!rule.onlyApproversCanEdit} onChange={e => updateRule(stage.stageKey, { onlyApproversCanEdit: e.target.checked })} />}
                                                    label={<Typography variant="caption">Only Approvers</Typography>}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    size="small" value={rule.required} sx={{ fontSize: '0.75rem' }}
                                                    onChange={e => updateRule(stage.stageKey, { required: e.target.value as any })}
                                                >
                                                    <MenuItem value="INHERIT">Inherit</MenuItem>
                                                    <MenuItem value="REQUIRED">Req.</MenuItem>
                                                    <MenuItem value="OPTIONAL">Opt.</MenuItem>
                                                </Select>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Box>
                )}

                <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" spacing={2}>
                        <Button variant="contained" fullWidth startIcon={<SaveIcon />} onClick={() => onSave(localField)}>
                            Apply Changes
                        </Button>
                        <Button fullWidth onClick={onClose}>Cancel</Button>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
};
