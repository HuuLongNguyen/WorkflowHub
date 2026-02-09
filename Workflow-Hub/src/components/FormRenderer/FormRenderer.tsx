
import React, { useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Box, Typography, Paper, TextField, MenuItem,
    Checkbox, FormControlLabel, Grid, Button
} from '@mui/material';
import type { Form, Field } from '../../types';
import { buildZodSchema, canViewField, canEditField, isFieldRequired } from '../../utils/rules';

interface FormRendererProps {
    form: Form;
    stageKey: string;
    actorUserId: string;
    resolvedApprovers: Record<string, string[]>;
    initialData?: any;
    onSubmit: (data: any) => void;
    readOnly?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({
    form, stageKey, actorUserId, resolvedApprovers, initialData, onSubmit, readOnly
}) => {
    const schema = useMemo(() =>
        buildZodSchema(form, stageKey, actorUserId, resolvedApprovers),
        [form, stageKey, actorUserId, resolvedApprovers]
    );

    const methods = useForm({
        resolver: zodResolver(schema),
        defaultValues: initialData || {},
        mode: 'onBlur'
    });

    const currentStageApprovers = resolvedApprovers[stageKey] || [];

    const renderField = (field: Field) => {
        const visible = canViewField(field, stageKey);
        if (!visible) return null;

        const editable = !readOnly && canEditField(field, stageKey, actorUserId, currentStageApprovers);
        const required = isFieldRequired(field, stageKey);

        const colSpan = field.colSpan || 1;
        // In MUI Grid v2, 12 columns. Span 1 (half) = 6, Span 2 (full) = 12.
        const gridXs = colSpan === 2 ? 12 : 6;

        return (
            <Grid size={{ xs: 12, md: gridXs }} key={field.id}>
                <Box sx={{ mb: 2 }}>
                    <Controller
                        name={field.key}
                        control={methods.control}
                        render={({ field: { onChange, value, ref }, fieldState: { error } }) => (
                            <>
                                {field.type === 'checkbox' ? (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={!!value}
                                                onChange={e => onChange(e.target.checked)}
                                                disabled={!editable}
                                            />
                                        }
                                        label={field.label + (required ? ' *' : '')}
                                    />
                                ) : field.type === 'textarea' ? (
                                    <TextField
                                        fullWidth multiline rows={3}
                                        label={field.label}
                                        value={value || ''}
                                        onChange={onChange}
                                        inputRef={ref}
                                        error={!!error}
                                        helperText={error?.message || field.helpText}
                                        disabled={!editable}
                                        required={required}
                                    />
                                ) : (
                                    <TextField
                                        fullWidth
                                        label={field.label}
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        value={value || ''}
                                        onChange={onChange}
                                        inputRef={ref}
                                        error={!!error}
                                        helperText={error?.message || field.helpText}
                                        disabled={!editable}
                                        required={required}
                                        select={field.type === 'select'}
                                    >
                                        {field.type === 'select' && field.options?.map(opt => (
                                            <MenuItem key={opt.id} value={opt.value}>{opt.label}</MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </>
                        )}
                    />
                </Box>
            </Grid>
        );
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
                {form.sections.map(section => (
                    <Paper key={section.id} sx={{ p: 3, mb: 3 }} variant="outlined">
                        <Typography variant="h6" gutterBottom>{section.title}</Typography>
                        {section.description && <Typography variant="body2" color="text.secondary" paragraph>{section.description}</Typography>}
                        <Grid container spacing={3}>
                            {section.fieldIds?.map(fid => {
                                const field = form.fieldsById[fid];
                                return field ? renderField(field) : null;
                            })}
                        </Grid>
                    </Paper>
                ))}
                {!readOnly && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="contained" size="large">Submit Action</Button>
                    </Box>
                )}
            </form>
        </FormProvider>
    );
};
