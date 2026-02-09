
import React, { useState } from 'react';
import {
    Box, Typography, Tabs, Tab, Button, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    FormControl, InputLabel, Select, MenuItem, Chip, Checkbox, type SelectChangeEvent
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FileUpload as FileUploadIcon,
    FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';
import { useDirectoryStore } from '../store/directoryStore';
import { supabaseService } from '../services/supabaseService';


const DirectoryPage: React.FC = () => {
    const [tab, setTab] = useState(0);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const {
        users, departments, roles,
        addUser, updateUser, deleteUser,
        addDepartment, updateDepartment, deleteDepartment,
        addRole, updateRole, deleteRole,
        importDirectory
    } = useDirectoryStore();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await supabaseService.getDirectory();
                importDirectory(data);
            } catch (err) { console.error('Failed to load directory:', err); }
        };
        load();
    }, []);

    // Clear selection when changing tabs
    useEffect(() => {
        setSelectedIds([]);
    }, [tab]);

    const [dialog, setDialog] = useState<{ open: boolean, type: 'user' | 'dept' | 'role', data: any | null }>({
        open: false,
        type: 'user',
        data: null
    });

    const handleExport = () => {
        const data = { users, departments, roles };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `directory_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                importDirectory(json);
            } catch (err) { alert('Invalid JSON file'); }
        };
        reader.readAsText(file);
    };

    const handleSeedData = async () => {
        const depts = [
            { id: uuidv4(), name: 'Engineering' },
            { id: uuidv4(), name: 'Sales' },
            { id: uuidv4(), name: 'Marketing' },
            { id: uuidv4(), name: 'HR' },
            { id: uuidv4(), name: 'Finance' }
        ];

        const rls = [
            { id: uuidv4(), name: 'Manager' },
            { id: uuidv4(), name: 'Lead' },
            { id: uuidv4(), name: 'Associate' },
            { id: uuidv4(), name: 'Director' }
        ];

        const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        const randomUsers = Array.from({ length: 20 }).map((_, i) => {
            const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lname = lastNames[Math.floor(Math.random() * lastNames.length)];
            const dept = depts[Math.floor(Math.random() * depts.length)];
            const role = rls[Math.floor(Math.random() * rls.length)];
            return {
                id: uuidv4(),
                displayName: `${fname} ${lname}`,
                email: `${fname.toLowerCase()}.${lname.toLowerCase()}${i}@example.com`,
                departmentId: dept.id,
                roleIds: [role.id]
            };
        });

        const fullDirectory = { departments: depts, roles: rls, users: randomUsers };

        try {
            await supabaseService.saveDepartmentsBulk(depts);
            await supabaseService.saveRolesBulk(rls);
            await supabaseService.saveProfilesBulk(randomUsers);
            importDirectory(fullDirectory);
            alert('Seed data synced to Supabase!');
        } catch (err) { console.error('Seed sync failed:', err); }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;

        try {
            if (tab === 0) {
                await supabaseService.deleteProfilesBulk(selectedIds);
                selectedIds.forEach(id => deleteUser(id));
            } else if (tab === 1) {
                await supabaseService.deleteDepartmentsBulk(selectedIds);
                selectedIds.forEach(id => deleteDepartment(id));
            } else if (tab === 2) {
                await supabaseService.deleteRolesBulk(selectedIds);
                selectedIds.forEach(id => deleteRole(id));
            }
            setSelectedIds([]);
        } catch (err) {
            console.error('Bulk delete failed:', err);
            alert('Failed to delete some items from Supabase.');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const currentTabIds = tab === 0 ? users.map(u => u.id) : tab === 1 ? departments.map(d => d.id) : roles.map(r => r.id);
            setSelectedIds(currentTabIds);
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSave = async () => {
        const { type, data } = dialog;

        // Basic Validation
        if (type === 'user') {
            if (!data.displayName || !data.email) {
                alert('Display Name and Email are required.');
                return;
            }
        } else {
            if (!data.name) {
                alert('Name is required.');
                return;
            }
        }

        try {
            if (type === 'dept') {
                const deptToSave = data.id ? data : { ...data, id: uuidv4() };
                if (data.id) updateDepartment(data.id, deptToSave);
                else addDepartment(deptToSave);
                await supabaseService.saveDepartment(deptToSave);
            } else if (type === 'role') {
                const roleToSave = data.id ? data : { ...data, id: uuidv4() };
                if (data.id) updateRole(data.id, roleToSave);
                else addRole(roleToSave);
                await supabaseService.saveRole(roleToSave);
            } else if (type === 'user') {
                const userToSave = data.id ? data : { ...data, id: uuidv4() };
                if (data.id) updateUser(data.id, userToSave);
                else addUser(userToSave);
                await supabaseService.saveProfile(userToSave);
            }
            setDialog({ ...dialog, open: false });
        } catch (err: any) {
            console.error('Sync failed:', err);
            alert(`Failed to sync to Supabase: ${err.message || 'Unknown error'}. Check developer console for details.`);
        }
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4">Directory</Typography>
                <Stack direction="row" spacing={1}>
                    {selectedIds.length > 0 && (
                        <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={handleBulkDelete} sx={{ mr: 2 }}>
                            Delete Selected ({selectedIds.length})
                        </Button>
                    )}
                    <Button startIcon={<FileDownloadIcon />} onClick={handleExport}>Export</Button>
                    <Button startIcon={<FileUploadIcon />} component="label">
                        Import
                        <input type="file" hidden accept=".json" onChange={handleImport} />
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={handleSeedData}>Seed Sample Data</Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setDialog({
                            open: true,
                            type: tab === 0 ? 'user' : tab === 1 ? 'dept' : 'role',
                            data: tab === 0 ? { displayName: '', email: '', departmentId: '', roleIds: [] } : { name: '' }
                        })}
                    >
                        Add {tab === 0 ? 'User' : tab === 1 ? 'Department' : 'Role'}
                    </Button>
                </Stack>
            </Stack>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                    <Tab label={`Users (${users.length})`} />
                    <Tab label={`Departments (${departments.length})`} />
                    <Tab label={`Roles (${roles.length})`} />
                </Tabs>
            </Box>

            {tab === 0 && (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < users.length}
                                        checked={users.length > 0 && selectedIds.length === users.length}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Display Name</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Department</TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Roles</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((u) => (
                                <TableRow key={u.id} selected={selectedIds.includes(u.id)} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={selectedIds.includes(u.id)} onChange={() => toggleSelection(u.id)} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: '600' }}>{u.displayName}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        {departments.find(d => d.id === u.departmentId)?.name || <Chip size="small" label="None" />}
                                    </TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {u.roleIds.map(rid => (
                                                <Chip key={rid} size="small" label={roles.find(r => r.id === rid)?.name || rid} />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => setDialog({ open: true, type: 'user', data: u })}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete user?')) { supabaseService.deleteProfilesBulk([u.id]); deleteUser(u.id); } }}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {tab === 1 && (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < departments.length}
                                        checked={departments.length > 0 && selectedIds.length === departments.length}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {departments.map((d) => (
                                <TableRow key={d.id} selected={selectedIds.includes(d.id)} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={selectedIds.includes(d.id)} onChange={() => toggleSelection(d.id)} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{d.name}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => setDialog({ open: true, type: 'dept', data: d })}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete department?')) { supabaseService.deleteDepartmentsBulk([d.id]); deleteDepartment(d.id); } }}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {tab === 2 && (
                <TableContainer component={Paper} variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < roles.length}
                                        checked={roles.length > 0 && selectedIds.length === roles.length}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSelectAll(e.target.checked)}
                                    />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {roles.map((r) => (
                                <TableRow key={r.id} selected={selectedIds.includes(r.id)} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={selectedIds.includes(r.id)} onChange={() => toggleSelection(r.id)} />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{r.name}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => setDialog({ open: true, type: 'role', data: r })}><EditIcon fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete role?')) { supabaseService.deleteRolesBulk([r.id]); deleteRole(r.id); } }}><DeleteIcon fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* CRUD Dialog */}
            <Dialog open={dialog.open} onClose={() => setDialog({ ...dialog, open: false })} fullWidth maxWidth="xs">
                <DialogTitle>{dialog.data?.id ? 'Edit' : 'Add'} {dialog.type === 'user' ? 'User' : dialog.type === 'dept' ? 'Department' : 'Role'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {dialog.type === 'user' ? (
                            <>
                                <TextField
                                    fullWidth label="Display Name"
                                    value={dialog.data?.displayName || ''}
                                    onChange={e => setDialog({ ...dialog, data: { ...dialog.data, displayName: e.target.value } })}
                                />
                                <TextField
                                    fullWidth label="Email"
                                    value={dialog.data?.email || ''}
                                    onChange={e => setDialog({ ...dialog, data: { ...dialog.data, email: e.target.value } })}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        label="Department"
                                        value={dialog.data?.departmentId || ''}
                                        onChange={e => setDialog({ ...dialog, data: { ...dialog.data, departmentId: e.target.value } })}
                                    >
                                        <MenuItem value="">None</MenuItem>
                                        {departments.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Roles</InputLabel>
                                    <Select
                                        multiple
                                        label="Roles"
                                        value={dialog.data?.roleIds || []}
                                        onChange={(e: SelectChangeEvent<string[]>) => setDialog({ ...dialog, data: { ...dialog.data, roleIds: e.target.value as string[] } })}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {(selected as string[]).map((value) => (
                                                    <Chip key={value} size="small" label={roles.find(r => r.id === value)?.name || value} />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {roles.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </>
                        ) : (
                            <TextField
                                fullWidth label="Name"
                                value={dialog.data?.name || ''}
                                onChange={e => setDialog({ ...dialog, data: { ...dialog.data, name: e.target.value } })}
                            />
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialog({ ...dialog, open: false })}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DirectoryPage;
