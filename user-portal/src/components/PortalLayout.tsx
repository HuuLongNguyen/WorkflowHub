import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
    NavbarMenuToggle,
    NavbarMenu,
    NavbarMenuItem,
    Link,
    Button
} from '@nextui-org/react';

const PortalLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const menuItems = [
        { label: 'Home', path: '/' },
        { label: 'My Requests', path: '/my-requests' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            <Navbar
                isBordered
                isMenuOpen={isMenuOpen}
                onMenuOpenChange={setIsMenuOpen}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg"
                maxWidth="xl"
            >
                <NavbarContent className="sm:hidden" justify="start">
                    <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
                </NavbarContent>

                <NavbarContent className="sm:hidden pr-3" justify="center">
                    <NavbarBrand>
                        <p className="font-bold text-inherit text-lg bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            🚀 Request Portal
                        </p>
                    </NavbarBrand>
                </NavbarContent>

                <NavbarContent className="hidden sm:flex gap-4" justify="start">
                    <NavbarBrand
                        className="cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <p className="font-bold text-xl bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            🚀 Request Portal
                        </p>
                    </NavbarBrand>
                </NavbarContent>

                <NavbarContent className="hidden sm:flex gap-4" justify="center">
                    {menuItems.map((item) => (
                        <NavbarItem key={item.path} isActive={location.pathname === item.path}>
                            <Link
                                color={location.pathname === item.path ? 'primary' : 'foreground'}
                                className="cursor-pointer font-medium"
                                onPress={() => navigate(item.path)}
                            >
                                {item.label}
                            </Link>
                        </NavbarItem>
                    ))}
                </NavbarContent>

                <NavbarContent justify="end">
                    <NavbarItem>
                        <Button
                            color="primary"
                            variant="flat"
                            className="hidden sm:flex"
                            onPress={() => navigate('/')}
                        >
                            New Request
                        </Button>
                    </NavbarItem>
                </NavbarContent>

                <NavbarMenu className="pt-6">
                    {menuItems.map((item) => (
                        <NavbarMenuItem key={item.path}>
                            <Link
                                color={location.pathname === item.path ? 'primary' : 'foreground'}
                                className="w-full cursor-pointer text-lg"
                                size="lg"
                                onPress={() => {
                                    navigate(item.path);
                                    setIsMenuOpen(false);
                                }}
                            >
                                {item.label}
                            </Link>
                        </NavbarMenuItem>
                    ))}
                </NavbarMenu>
            </Navbar>

            <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <Outlet />
            </main>

            <footer className="border-t border-divider bg-white/50 dark:bg-slate-900/50 py-4 mt-8">
                <div className="container mx-auto max-w-7xl px-4 text-center">
                    <p className="text-sm text-default-500">
                        © 2026 Workflow Hub · User Portal
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PortalLayout;
