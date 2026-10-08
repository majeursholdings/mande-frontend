"use client";

import { useState } from "react";
import { MailPlus, RotateCw, UserCog, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { DataTable, StatusBadge, type ColumnDef, type RowAction } from "@/components/customTable";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import UserAvatar from "@/components/ui/userAvatar";
import { formatOrdinalDate } from "@/lib/date";
import { useAdminProfile } from "@/components/adminPlatform/dashboardLayout/adminProfileContext";
import { useStaffPlatform } from "@/components/adminPlatform/dashboardLayout/staffPlatformContext";
import { getSuperAdminRoleLabel, getSuperAdminRolePhrase, type SuperAdminRole } from "@/constant/superAdmin";
import ChangeSuperAdminRoleForm from "../form/changeSuperAdminRoleForm";
import InviteSuperAdminForm, { type InviteSuperAdminValues } from "../form/inviteSuperAdminForm";
import ReauthSteps from "../reauthSteps";
import { useSuperAdminSettings } from "../settingsContext";
import { getErrorMessage } from "@/lib/api";

type SuperAdminRow = {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    /** Their role, or the one they'll have once they accept. */
    role: SuperAdminRole;
    status: "active" | "invited";
    isMe: boolean;
    /** ISO date — when they joined, or when the latest invite went out. */
    date: string;
    invitedBy: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SuperAdminsTab — everyone who runs the platform, their roles, and the
// invites that haven't been accepted. Owners and tech support can invite
// another super admin, send an invite again or cancel it, and change
// someone's role (never their own, and always leaving an owner), confirming
// it's them first. Managers see who's who, but can't change any of it.
// ─────────────────────────────────────────────────────────────────────────────

export default function SuperAdminsTab() {
    const { superAdmins, invites, inviteSuperAdmin, resendInvite, cancelInvite, changeSuperAdminRole, sectionStatus } =
        useSuperAdminSettings();
    const { isLoading, isError } = sectionStatus.superAdmins;
    const { profile } = useAdminProfile();
    const { permissions } = useStaffPlatform();
    const [isInviting, setIsInviting] = useState(false);
    const [cancelling, setCancelling] = useState<SuperAdminRow | null>(null);
    const [changingRole, setChangingRole] = useState<SuperAdminRow | null>(null);
    const ownerCount = superAdmins.filter((superAdmin) => superAdmin.role === "owner").length;

    const rows: SuperAdminRow[] = [
        ...superAdmins.map((superAdmin): SuperAdminRow => {
            const isMe = superAdmin.email === profile.email;
            return {
                id: superAdmin.id,
                name: isMe ? `${superAdmin.name} (you)` : superAdmin.name,
                email: superAdmin.email,
                avatarUrl: superAdmin.avatarUrl,
                role: superAdmin.role,
                status: "active",
                isMe,
                date: superAdmin.joinedAt,
                invitedBy: null,
            };
        }),
        ...invites.map(
            (invite): SuperAdminRow => ({
                id: invite.id,
                name: `${invite.firstName} ${invite.lastName}`,
                email: invite.email,
                avatarUrl: null,
                role: invite.role,
                status: "invited",
                isMe: false,
                date: invite.invitedAt,
                invitedBy: invite.invitedBy,
            }),
        ),
    ];

    const columns: ColumnDef<SuperAdminRow>[] = [
        {
            key: "name",
            header: "Name",
            className: "whitespace-normal",
            cell: (row) => (
                <span className="flex items-center gap-3">
                    <UserAvatar name={row.name} src={row.avatarUrl} className="size-8 text-xs" />
                    <span className="flex min-w-0 flex-col">
                        <span className="font-medium text-mist-950">{row.name}</span>
                        <span className="text-xs break-all text-gray-500">{row.email}</span>
                    </span>
                </span>
            ),
        },
        {
            key: "role",
            header: "Role",
            cell: (row) => <span className="text-mist-900">{getSuperAdminRoleLabel(row.role)}</span>,
        },
        {
            key: "status",
            header: "Status",
            cell: (row) =>
                row.status === "active" ? (
                    <StatusBadge label="Active" tone="green" />
                ) : (
                    <StatusBadge label="Invite sent" tone="amber" />
                ),
        },
        {
            key: "date",
            header: "Since",
            className: "hidden sm:table-cell",
            cell: (row) => (
                <span className="flex flex-col">
                    <span className="text-mist-900">{formatOrdinalDate(new Date(row.date))}</span>
                    {row.invitedBy && <span className="text-xs text-mist-400">Invited by {row.invitedBy}</span>}
                </span>
            ),
        },
    ];

    // Only owners and tech support change who's a super admin, and what they can do
    const rowActions: RowAction<SuperAdminRow>[] = permissions.managesSuperAdmins
        ? [
              {
                  label: "Change role",
                  icon: <UserCog className="size-3.5" aria-hidden />,
                  hidden: (row) => row.status !== "active" || row.isMe,
                  onSelect: setChangingRole,
              },
              {
                  label: "Send invite again",
                  icon: <RotateCw className="size-3.5" aria-hidden />,
                  hidden: (row) => row.status !== "invited",
                  onSelect: async (row) => {
                      try {
                          await resendInvite(row.id);
                          toast.success(`Invite sent again to ${row.email}`);
                      } catch (err) {
                          toast.error(getErrorMessage(err, "Couldn't send the invite. Please try again."));
                      }
                  },
              },
              {
                  label: "Cancel invite",
                  icon: <X className="size-3.5" aria-hidden />,
                  tone: "danger",
                  hidden: (row) => row.status !== "invited",
                  onSelect: setCancelling,
              },
          ]
        : [];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-md text-sm font-text text-mist-500">
                    {permissions.managesSuperAdmins
                        ? "Owners and tech support can do everything. Managers can do everything except invite or change super admins and see API keys. New super admins join once they accept the invite in their email."
                        : "Only an owner or tech support can invite super admins or change their roles."}
                </p>
                {permissions.managesSuperAdmins && (
                    <button
                        type="button"
                        onClick={() => setIsInviting(true)}
                        className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-secondary-700 px-3 text-sm font-medium font-text text-white transition-colors hover:bg-secondary-900 cursor-pointer"
                    >
                        <UserPlus className="size-4" aria-hidden />
                        Invite super admin
                    </button>
                )}
            </div>

            <DataTable
                tableId="super-admins"
                columns={columns}
                rows={rows}
                rowActions={rowActions}
                compact
                loading={isLoading}
                error={isError && rows.length === 0 ? "We couldn't load the super admins. Please refresh the page." : undefined}
                emptyMessage="No super admins yet."
            />

            <InviteDialog
                open={isInviting}
                takenEmails={rows.map((row) => row.email.toLowerCase())}
                onClose={() => setIsInviting(false)}
                onInvite={async (values, reauthToken) => {
                    try {
                        await inviteSuperAdmin(values, reauthToken);
                        toast.success(`Invite sent to ${values.email}`);
                    } catch (err) {
                        // Shown in the dialog, which stays open with what they typed
                        throw new Error(getErrorMessage(err, "Couldn't send the invite. Please try again."));
                    }
                }}
            />

            <ChangeRoleDialog
                superAdmin={changingRole}
                isLastOwner={changingRole?.role === "owner" && ownerCount <= 1}
                onClose={() => setChangingRole(null)}
                onChange={async (row, role, reauthToken) => {
                    try {
                        await changeSuperAdminRole(row.id, role, reauthToken);
                        toast.success(`${row.name} is now ${getSuperAdminRolePhrase(role)}`);
                    } catch (err) {
                        throw new Error(getErrorMessage(err, "Couldn't change their role. Please try again."));
                    }
                }}
            />

            <Dialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Cancel the invite to {cancelling?.name}?</DialogTitle>
                        <DialogDescription>
                            The link in their email stops working. You can invite them again later.
                        </DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => setCancelling(null)}
                            className="h-11 px-5 bg-mist-100 hover:bg-mist-200 text-mist-950 font-medium font-text rounded-button cursor-pointer"
                        >
                            Keep it
                        </Button>
                        <Button
                            type="button"
                            onClick={async () => {
                                if (!cancelling) return;
                                try {
                                    await cancelInvite(cancelling.id);
                                    toast.success(`The invite to ${cancelling.email} was cancelled`);
                                } catch (err) {
                                    toast.error(getErrorMessage(err, "Couldn't cancel the invite. Please try again."));
                                }
                                setCancelling(null);
                            }}
                            className="h-11 px-5 bg-error-600 hover:bg-error-700 text-white font-medium font-text rounded-button cursor-pointer"
                        >
                            Cancel invite
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** Who to invite and as what, then confirming it's you: the invite only goes once both are done. */
function InviteDialog({
    open,
    takenEmails,
    onClose,
    onInvite,
}: {
    open: boolean;
    takenEmails: string[];
    onClose: () => void;
    onInvite: (values: InviteSuperAdminValues, reauthToken: string) => Promise<void> | void;
}) {
    const [pending, setPending] = useState<InviteSuperAdminValues | null>(null);
    const close = () => {
        setPending(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
            <DialogContent className="max-w-110">
                <div className="flex flex-col gap-1">
                    <DialogTitle className="flex items-center gap-2">
                        <MailPlus className="size-5 text-mist-500" aria-hidden />
                        Invite a super admin
                    </DialogTitle>
                    <DialogDescription>
                        {pending
                            ? `${pending.firstName} ${pending.lastName} will get an invite at ${pending.email}, as ${getSuperAdminRolePhrase(pending.role)}.`
                            : "They'll get an email to accept the invite and set their password."}
                    </DialogDescription>
                </div>
                {pending ? (
                    <ReauthSteps
                        confirmLabel="Send invite"
                        onCancel={close}
                        onConfirmed={async (reauthToken) => {
                            await onInvite(pending, reauthToken);
                            close();
                        }}
                    />
                ) : (
                    <InviteSuperAdminForm takenEmails={takenEmails} onSubmit={setPending} onCancel={close} />
                )}
            </DialogContent>
        </Dialog>
    );
}

/** Their new role, then confirming it's you: the change only happens once both are done. */
function ChangeRoleDialog({
    superAdmin,
    isLastOwner,
    onClose,
    onChange,
}: {
    superAdmin: SuperAdminRow | null;
    isLastOwner: boolean;
    onClose: () => void;
    onChange: (superAdmin: SuperAdminRow, role: SuperAdminRole, reauthToken: string) => Promise<void> | void;
}) {
    const [pendingRole, setPendingRole] = useState<SuperAdminRole | null>(null);
    const close = () => {
        setPendingRole(null);
        onClose();
    };

    return (
        <Dialog open={!!superAdmin} onOpenChange={(isOpen) => !isOpen && close()}>
            <DialogContent className="max-w-110">
                <div className="flex flex-col gap-1">
                    <DialogTitle className="flex items-center gap-2">
                        <UserCog className="size-5 text-mist-500" aria-hidden />
                        Change {superAdmin?.name}&apos;s role
                    </DialogTitle>
                    <DialogDescription>
                        {pendingRole
                            ? `They'll be ${getSuperAdminRolePhrase(pendingRole)} straight away, and we'll email them to say so.`
                            : `They're ${superAdmin ? getSuperAdminRolePhrase(superAdmin.role) : ""} now.`}
                    </DialogDescription>
                </div>
                {superAdmin &&
                    (pendingRole ? (
                        <ReauthSteps
                            confirmLabel="Change role"
                            onCancel={close}
                            onConfirmed={async (reauthToken) => {
                                await onChange(superAdmin, pendingRole, reauthToken);
                                close();
                            }}
                        />
                    ) : (
                        <ChangeSuperAdminRoleForm
                            name={superAdmin.name}
                            currentRole={superAdmin.role}
                            isLastOwner={isLastOwner}
                            onSubmit={setPendingRole}
                            onCancel={close}
                        />
                    ))}
            </DialogContent>
        </Dialog>
    );
}
