import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Card,
    CardBody,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Button,
    Tabs,
    Tab,
    Spinner
} from '@nextui-org/react';
import { usePortalStore } from '../store/portalStore';
import { portalService } from '../services/portalService';

const MyRequestsPage: React.FC = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState<string | number>('submissions');
    const [loading, setLoading] = useState(true);

    const {
        currentUser,
        forms,
        myTasks, setMyTasks,
        pendingApprovals, setPendingApprovals
    } = usePortalStore();

    useEffect(() => {
        const loadTasks = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }
            try {
                const [my, pending] = await Promise.all([
                    portalService.getMyTasks(currentUser.id),
                    portalService.getPendingApprovals(currentUser.id),
                ]);
                setMyTasks(my);
                setPendingApprovals(pending);
            } catch (err) {
                console.error('Failed to load tasks:', err);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size="lg" label="Loading requests..." />
            </div>
        );
    }

    const getStatusColor = (status: string): "success" | "danger" | "primary" | "default" => {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'REJECTED': return 'danger';
            case 'IN_PROGRESS': return 'primary';
            default: return 'default';
        }
    };

    const columns = [
        { key: 'form', label: 'FORM' },
        { key: 'stage', label: 'STAGE' },
        { key: 'status', label: 'STATUS' },
        { key: 'created', label: 'CREATED' },
        { key: 'actions', label: '' },
    ];

    const renderTable = (tasks: typeof myTasks) => {
        if (tasks.length === 0) {
            return (
                <Card>
                    <CardBody className="text-center py-12">
                        <p className="text-default-500">No requests found.</p>
                    </CardBody>
                </Card>
            );
        }

        return (
            <div className="overflow-x-auto">
                <Table
                    aria-label="Requests table"
                    classNames={{
                        wrapper: "min-h-[200px]",
                    }}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn key={column.key} className="uppercase text-xs">
                                {column.label}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody items={tasks}>
                        {(task) => {
                            const form = forms.find(f => f.id === task.formId);
                            return (
                                <TableRow key={task.id}>
                                    <TableCell>
                                        <span className="font-medium">{form?.name || 'Unknown'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-default-600">{task.currentStageKey}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Chip size="sm" color={getStatusColor(task.status)} variant="flat">
                                            {task.status}
                                        </Chip>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-small text-default-500">
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onPress={() => navigate(`/task/${task.id}`)}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        }}
                    </TableBody>
                </Table>
            </div>
        );
    };

    // Mobile card view
    const renderMobileCards = (tasks: typeof myTasks) => {
        if (tasks.length === 0) {
            return (
                <Card>
                    <CardBody className="text-center py-12">
                        <p className="text-default-500">No requests found.</p>
                    </CardBody>
                </Card>
            );
        }

        return (
            <div className="space-y-3">
                {tasks.map(task => {
                    const form = forms.find(f => f.id === task.formId);
                    return (
                        <Card key={task.id} isPressable onPress={() => navigate(`/task/${task.id}`)}>
                            <CardBody className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{form?.name || 'Unknown'}</p>
                                        <p className="text-small text-default-500">
                                            {task.currentStageKey} · {new Date(task.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Chip size="sm" color={getStatusColor(task.status)} variant="flat">
                                        {task.status}
                                    </Chip>
                                </div>
                            </CardBody>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const currentTasks = tab === 'submissions' ? myTasks : pendingApprovals;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold">My Requests</h1>

            <Tabs
                selectedKey={tab}
                onSelectionChange={setTab}
                aria-label="Request tabs"
                color="primary"
                variant="underlined"
                classNames={{
                    tabList: "gap-6",
                    cursor: "w-full",
                }}
            >
                <Tab
                    key="submissions"
                    title={
                        <div className="flex items-center gap-2">
                            <span>My Submissions</span>
                            <Chip size="sm" variant="flat">{myTasks.length}</Chip>
                        </div>
                    }
                />
                <Tab
                    key="approvals"
                    title={
                        <div className="flex items-center gap-2">
                            <span>Pending My Approval</span>
                            <Chip size="sm" variant="flat" color="warning">{pendingApprovals.length}</Chip>
                        </div>
                    }
                />
            </Tabs>

            {/* Desktop Table */}
            <div className="hidden sm:block">
                {renderTable(currentTasks)}
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden">
                {renderMobileCards(currentTasks)}
            </div>
        </div>
    );
};

export default MyRequestsPage;
