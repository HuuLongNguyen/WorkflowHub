import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Button,
    Chip,
    Avatar,
    Select,
    SelectItem,
    Spinner,
    Divider
} from '@nextui-org/react';
import { usePortalStore } from '../store/portalStore';
import { portalService } from '../services/portalService';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const {
        currentUser, setCurrentUser,
        users, setDirectory,
        forms, setForms,
        processes, setProcesses,
        myTasks, setMyTasks,
        pendingApprovals, setPendingApprovals
    } = usePortalStore();

    useEffect(() => {
        const loadData = async () => {
            try {
                const [formsData, processesData, directoryData] = await Promise.all([
                    portalService.getForms(),
                    portalService.getProcesses(),
                    portalService.getDirectory(),
                ]);
                setForms(formsData);
                setProcesses(processesData);
                setDirectory(directoryData);

                if (directoryData.users.length > 0 && !currentUser) {
                    setCurrentUser(directoryData.users[0]);
                }
            } catch (err) {
                console.error('Failed to load portal data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        const loadTasks = async () => {
            if (!currentUser) return;
            try {
                const [my, pending] = await Promise.all([
                    portalService.getMyTasks(currentUser.id),
                    portalService.getPendingApprovals(currentUser.id),
                ]);
                setMyTasks(my);
                setPendingApprovals(pending);
            } catch (err) {
                console.error('Failed to load tasks:', err);
            }
        };
        loadTasks();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" label="Loading..." />
            </div>
        );
    }

    const activeRequests = myTasks.filter(t => t.status === 'DRAFT' || t.status === 'IN_PROGRESS');
    const completedRequests = myTasks.filter(t => t.status === 'COMPLETED' || t.status === 'REJECTED');

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* User Selector Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg">
                <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 sm:p-6">
                    <Avatar
                        name={currentUser?.displayName?.charAt(0) || '?'}
                        size="lg"
                        className="bg-white text-blue-600 font-bold"
                    />
                    <div className="flex-grow">
                        <p className="text-sm opacity-80">Logged in as</p>
                        <p className="text-xl sm:text-2xl font-bold">{currentUser?.displayName || 'Select a user'}</p>
                    </div>
                    <Select
                        label="Switch User"
                        placeholder="Select user"
                        selectedKeys={currentUser ? [currentUser.id] : []}
                        className="w-full sm:w-64"
                        classNames={{
                            trigger: "bg-white/20 data-[hover=true]:bg-white/30",
                            value: "text-white",
                            label: "text-white/80",
                        }}
                        onChange={(e) => {
                            const user = users.find(u => u.id === e.target.value);
                            if (user) setCurrentUser(user);
                        }}
                    >
                        {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                                {u.displayName}
                            </SelectItem>
                        ))}
                    </Select>
                </CardBody>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-none">
                    <CardBody className="text-center py-6">
                        <p className="text-4xl sm:text-5xl font-bold text-blue-600">{activeRequests.length}</p>
                        <p className="text-default-600 mt-1">Active Requests</p>
                    </CardBody>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-900/20 border-none">
                    <CardBody className="text-center py-6">
                        <p className="text-4xl sm:text-5xl font-bold text-amber-600">{pendingApprovals.length}</p>
                        <p className="text-default-600 mt-1">Pending My Approval</p>
                    </CardBody>
                </Card>
                <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-none">
                    <CardBody className="text-center py-6">
                        <p className="text-4xl sm:text-5xl font-bold text-emerald-600">{completedRequests.length}</p>
                        <p className="text-default-600 mt-1">Completed</p>
                    </CardBody>
                </Card>
            </div>

            {/* Available Forms */}
            <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Start a New Request</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forms.map(form => {
                        const process = processes.find(p => p.id === form.processId);
                        return (
                            <Card key={form.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader className="flex gap-3">
                                    <div className="flex flex-col">
                                        <p className="text-lg font-semibold">{form.name}</p>
                                        <p className="text-small text-default-500">
                                            {Object.keys(form.fieldsById).length} fields · {form.sections.length} sections
                                        </p>
                                    </div>
                                </CardHeader>
                                <Divider />
                                <CardBody>
                                    {process && (
                                        <Chip size="sm" variant="flat" color="primary">
                                            Workflow: {process.name}
                                        </Chip>
                                    )}
                                </CardBody>
                                <CardFooter>
                                    <Button
                                        color="primary"
                                        className="w-full"
                                        onPress={() => navigate(`/new-request/${form.id}`)}
                                    >
                                        Start Request
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                    {forms.length === 0 && (
                        <Card className="col-span-full">
                            <CardBody className="text-center py-8">
                                <p className="text-default-500">No forms available. Please contact your administrator.</p>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>

            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                        <span>⏳</span> Awaiting Your Approval
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pendingApprovals.map(task => {
                            const form = forms.find(f => f.id === task.formId);
                            return (
                                <Card key={task.id} className="border-l-4 border-l-amber-500">
                                    <CardBody>
                                        <p className="font-semibold">{form?.name || 'Unknown Form'}</p>
                                        <p className="text-small text-default-500">Stage: {task.currentStageKey}</p>
                                        <Chip size="sm" color="warning" className="mt-2">Pending</Chip>
                                    </CardBody>
                                    <CardFooter>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            onPress={() => navigate(`/task/${task.id}`)}
                                        >
                                            Review
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Recent Requests */}
            {myTasks.length > 0 && (
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-4">My Recent Requests</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {myTasks.slice(0, 6).map(task => {
                            const form = forms.find(f => f.id === task.formId);
                            const statusColor = task.status === 'COMPLETED' ? 'success' :
                                task.status === 'REJECTED' ? 'danger' :
                                    task.status === 'IN_PROGRESS' ? 'primary' : 'default';
                            return (
                                <Card key={task.id} className="hover:shadow-md transition-shadow">
                                    <CardBody>
                                        <p className="font-semibold">{form?.name || 'Unknown Form'}</p>
                                        <p className="text-small text-default-500">
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </p>
                                        <Chip size="sm" color={statusColor} className="mt-2">
                                            {task.status}
                                        </Chip>
                                    </CardBody>
                                    <CardFooter>
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            onPress={() => navigate(`/task/${task.id}`)}
                                        >
                                            View
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
