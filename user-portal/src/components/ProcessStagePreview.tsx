
import React, { useMemo } from 'react';
import { Card, CardBody, User as UserAvatar, Chip, Divider } from "@nextui-org/react";
import { usePortalStore } from '../store/portalStore';
import { resolveApprovers } from '../utils/rules';
import type { Process } from '../types';

interface ProcessStagePreviewProps {
    process: Process;
    requesterUserId: string;
    requesterDepartmentId?: string;
}

export const ProcessStagePreview: React.FC<ProcessStagePreviewProps> = ({
    process,
    requesterUserId,
    requesterDepartmentId
}) => {
    const { users, departments, roles } = usePortalStore();

    const stagesWithApprovers = useMemo(() => {
        const directory = { users, departments, roles };
        const resolved = resolveApprovers(process, directory, {
            requesterUserId,
            requesterDepartmentId
        });

        const sortedStages = [...process.stages].sort((a, b) => a.order - b.order);

        return sortedStages.map((stage, index) => {
            const approverIds = resolved[stage.stageKey] || [];
            const approverUsers = users.filter(u => approverIds.includes(u.id));

            return {
                ...stage,
                approverUsers,
                isFinal: index === sortedStages.length - 1
            };
        });
    }, [process, users, departments, roles, requesterUserId, requesterDepartmentId]);

    return (
        <Card className="h-full bg-content1 shadow-sm border border-default-100">
            <CardBody className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-primary rounded-full"></span>
                    Approval Workflow
                </h3>

                <div className="relative pl-4 space-y-8">
                    {/* Vertical Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-default-200" />

                    {stagesWithApprovers.map((stage, idx) => (
                        <div key={stage.id} className="relative flex gap-4 group">
                            {/* Step Indicator */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className={`
                                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
                                    bg-default-100 border-default-400 text-default-600
                                    group-hover:border-primary group-hover:text-primary transition-colors
                                `}>
                                    {idx + 1}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold text-default-900">{stage.name}</h4>
                                        <p className="text-xs text-default-500">
                                            {idx === 0 ? "First Stage" : "Pending Approval"}
                                        </p>
                                    </div>
                                    <Chip size="sm" variant="flat" color="default">
                                        Manual Approval
                                    </Chip>
                                </div>

                                <div className="bg-default-50 rounded-lg p-3 border border-default-100">
                                    <div className="text-xs text-default-500 mb-2 uppercase tracking-wider font-semibold">
                                        Approvers
                                    </div>

                                    {stage.approverUsers.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {stage.approverUsers.map(user => (
                                                <div key={user.id} className="flex justify-between items-center">
                                                    <UserAvatar
                                                        name={user.displayName}
                                                        description={roles.find(r => user.roleIds.includes(r.id))?.name || "Employee"}
                                                        avatarProps={{
                                                            size: "sm",
                                                            isBordered: true,
                                                            className: "w-6 h-6 text-xs"
                                                        }}
                                                        classNames={{
                                                            description: "text-tiny"
                                                        }}
                                                    />
                                                    <span className="text-tiny text-default-400">
                                                        est. 2 days
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-small text-warning">
                                            No approvers found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Divider className="my-6" />

                <div className="flex justify-between items-center text-small text-default-500 bg-default-50 p-3 rounded-lg">
                    <span>Total Stages</span>
                    <span className="font-semibold text-default-900">{stagesWithApprovers.length}</span>
                </div>
            </CardBody>
        </Card>
    );
};
