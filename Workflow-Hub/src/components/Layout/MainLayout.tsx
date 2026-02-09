
import React from 'react';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
    ListItemText, AppBar, Toolbar, Typography, Divider, IconButton
} from '@mui/material';
import {
    People as PeopleIcon,
    AccountTree as ProcessIcon,
    Description as FormIcon,
    Assignment as TaskIcon,
    Dashboard as DashboardIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import SyncButton from '../SupabaseSync/SyncButton';
import { supabaseService } from '../../services/supabaseService';
import { useDirectoryStore } from '../../store/directoryStore';
import { useProcessStore } from '../../store/processStore';
import { useFormStore } from '../../store/formStore';
import { useTaskStore } from '../../store/taskStore';

const drawerWidth = 240;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const importDirectory = useDirectoryStore(state => state.importDirectory);
    const importProcesses = useProcessStore(state => state.importProcesses);
    const importForms = useFormStore(state => state.importForms);
    const importTasks = useTaskStore(state => state.importTasks);

    useEffect(() => {
        const hydrate = async () => {
            try {
                const [dir, procs, forms, tasks] = await Promise.all([
                    supabaseService.getDirectory(),
                    supabaseService.getProcesses(),
                    supabaseService.getForms(),
                    supabaseService.getTasks()
                ]);

                importDirectory(dir);
                importProcesses(procs);
                importForms(forms);
                importTasks(tasks);
            } catch (err) {
                console.error('Initial hydration failed:', err);
            }
        };
        hydrate();
    }, [importDirectory, importProcesses, importForms, importTasks]);

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Directory', icon: <PeopleIcon />, path: '/directory' },
        { text: 'Processes', icon: <ProcessIcon />, path: '/processes' },
        { text: 'Forms', icon: <FormIcon />, path: '/forms' },
        { text: 'Tasks', icon: <TaskIcon />, path: '/tasks' },
    ];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box>
            <Toolbar>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
                    TaskFlow Pro
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon color={location.pathname === item.path ? 'primary' : 'inherit'}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'white',
                    color: 'text.primary',
                    boxShadow: 'none',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
                        {menuItems.find(item => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)))?.text || 'Builder'}
                    </Typography>
                    <SyncButton />
                </Toolbar>
            </AppBar>
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default MainLayout;
