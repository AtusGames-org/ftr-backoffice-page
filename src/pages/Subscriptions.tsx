import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import {
    cancelAdminSubscription,
    createAdminSubscription,
    findUserByEmail,
    getSubscriptionsPage,
    updateAdminSubscriptionSlots,
} from '../services/subscriptionService';
import type { Subscription } from '../services/subscriptionService';

const subscriptionsPageSize = 20;

const statusLabels: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    pending_cancellation: 'Pending cancellation',
    canceled: 'Canceled',
};

const formatStatus = (status: string) => statusLabels[status] ?? status;

const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1) {
        return '—';
    }
    return date.toLocaleDateString();
};

// State of the action pending confirmation. Every action (create, cancel,
// update slots) goes through this before hitting the API. "Reactivate" is
// just a shortcut into the same 'grant' action, pre-filled from the row.
type PendingAction =
    | { type: 'cancel'; sub: Subscription }
    | { type: 'grant'; userId: string; email: string; slots: number; isReactivate?: boolean }
    | { type: 'updateSlots'; sub: Subscription; newSlots: number };

function Subscriptions() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [page, setPage] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [grantDialogOpen, setGrantDialogOpen] = useState(false);
    const [grantEmail, setGrantEmail] = useState('');
    const [grantSlots, setGrantSlots] = useState('1');
    const [grantError, setGrantError] = useState<string | null>(null);
    const [grantLoading, setGrantLoading] = useState(false);

    const [reactivateTarget, setReactivateTarget] = useState<Subscription | null>(null);
    const [reactivateSlots, setReactivateSlots] = useState('1');
    const [reactivateError, setReactivateError] = useState<string | null>(null);

    const [slotsDialogTarget, setSlotsDialogTarget] = useState<Subscription | null>(null);
    const [slotsInput, setSlotsInput] = useState('');

    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadSubscriptions = async (nextPage = page) => {
        setLoading(true);
        try {
            const response = await getSubscriptionsPage(nextPage * subscriptionsPageSize, subscriptionsPageSize);
            setSubscriptions(response.items);
            setTotal(response.total);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscriptions(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const totalPages = Math.max(1, Math.ceil(total / subscriptionsPageSize));
    const subscriptionsCountLabel = useMemo(() => `${total} subscriptions`, [total]);

    // --- Grant ---------------------------------------------------

    const openGrantDialog = () => {
        setGrantEmail('');
        setGrantSlots('1');
        setGrantError(null);
        setGrantDialogOpen(true);
    };

    const submitGrantForm = async () => {
        const slotsValue = Number.parseInt(grantSlots, 10);
        if (!grantEmail.trim()) {
            setGrantError('Please enter an email.');
            return;
        }
        if (Number.isNaN(slotsValue) || slotsValue <= 0) {
            setGrantError('Slots must be greater than 0.');
            return;
        }

        setGrantLoading(true);
        setGrantError(null);
        try {
            const user = await findUserByEmail(grantEmail.trim());
            if (!user) {
                setGrantError('No user found with that email.');
                return;
            }

            setGrantDialogOpen(false);
            setPendingAction({ type: 'grant', userId: user.id, email: user.email, slots: slotsValue });
        } finally {
            setGrantLoading(false);
        }
    };

    // --- Reactivate (form for slots, then same 'grant' action) -----------

    const openReactivateDialog = (sub: Subscription) => {
        setReactivateTarget(sub);
        setReactivateSlots(String(sub.slots > 0 ? sub.slots : 1));
        setReactivateError(null);
    };

    const submitReactivateForm = () => {
        if (!reactivateTarget) return;
        const slotsValue = Number.parseInt(reactivateSlots, 10);
        if (Number.isNaN(slotsValue) || slotsValue <= 0) {
            setReactivateError('Slots must be greater than 0.');
            return;
        }

        const sub = reactivateTarget;
        setReactivateTarget(null);
        setPendingAction({
            type: 'grant',
            userId: sub.userId,
            email: sub.email,
            slots: slotsValue,
            isReactivate: true,
        });
    };

    // --- Update slots --------------------------------------------------

    const openSlotsDialog = (sub: Subscription) => {
        setSlotsDialogTarget(sub);
        setSlotsInput(String(sub.slots));
    };

    const submitSlotsForm = () => {
        if (!slotsDialogTarget) return;
        const slotsValue = Number.parseInt(slotsInput, 10);
        if (Number.isNaN(slotsValue) || slotsValue <= 0) {
            return;
        }
        const sub = slotsDialogTarget;
        setSlotsDialogTarget(null);
        setPendingAction({ type: 'updateSlots', sub, newSlots: slotsValue });
    };

    // --- Generic confirmation ---------------------------------------------

    const confirmPendingAction = async () => {
        if (!pendingAction) return;
        setActionError(null);
        try {
            if (pendingAction.type === 'cancel') {
                await cancelAdminSubscription(pendingAction.sub.userId);
            } else if (pendingAction.type === 'grant') {
                await createAdminSubscription(pendingAction.userId, pendingAction.email, pendingAction.slots);
            } else if (pendingAction.type === 'updateSlots') {
                await updateAdminSubscriptionSlots(pendingAction.sub.userId, pendingAction.newSlots);
            }
            setPendingAction(null);
            await loadSubscriptions(page);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Something went wrong while processing the action.');
        }
    };

    const pendingActionMessage = (() => {
        if (!pendingAction) return '';
        if (pendingAction.type === 'cancel') {
            return `Are you sure you want to cancel the subscription for ${pendingAction.sub.email}? This action is immediate.`;
        }
        if (pendingAction.type === 'grant') {
            if (pendingAction.isReactivate) {
                return `Are you sure you want to reactivate the free subscription of ${pendingAction.slots} slot(s) for ${pendingAction.email}?`;
            }
            return `Are you sure you want to grant a free subscription of ${pendingAction.slots} slot(s) to ${pendingAction.email}?`;
        }
        return `Are you sure you want to change the slots for ${pendingAction.sub.email} from ${pendingAction.sub.slots} to ${pendingAction.newSlots}?`;
    })();

    return (
        <div className="app-card p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="app-title text-2xl">Subscriptions</h2>
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">{subscriptionsCountLabel}</p>
                </div>
                <Button variant="contained" color="primary" onClick={openGrantDialog}>
                    Grant Subscription
                </Button>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-[#2a2640]">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Email</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Slots</TableCell>
                            <TableCell>Next Billing</TableCell>
                            <TableCell>Amount Due</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subscriptions.map((sub) => {
                            const isCanceled = sub.status === 'canceled' || sub.status === 'pending_cancellation';
                            return (
                                <TableRow key={sub.userId} hover>
                                    <TableCell>{sub.email}</TableCell>
                                    <TableCell>{formatStatus(sub.status)}</TableCell>
                                    <TableCell>{sub.isAdminGranted ? 'Admin (Free)' : (sub.status === 'canceled' ? '-' : 'Stripe')}</TableCell>
                                    <TableCell>
                                        {sub.usedSlots} / {sub.slots}
                                    </TableCell>
                                    <TableCell>{formatDate(sub.nextBillingDate)}</TableCell>
                                    <TableCell>${sub.amountDue.toFixed(2)}</TableCell>
                                    <TableCell align="right">
                                        <div className="flex justify-end gap-2">
                                            {sub.isAdminGranted && !isCanceled && (
                                                <Button size="small" variant="outlined" onClick={() => openSlotsDialog(sub)}>
                                                    Update Slots
                                                </Button>
                                            )}
                                            {isCanceled ? (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    onClick={() => openReactivateDialog(sub)}
                                                >
                                                    Reactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="secondary"
                                                    onClick={() => setPendingAction({ type: 'cancel', sub })}
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {!loading && subscriptions.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-sm text-[rgba(184,176,214,0.8)]">
                                    No subscriptions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <Button
                    size="small"
                    variant="outlined"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                    Previous
                </Button>
                <p className="text-xs text-[rgba(184,176,214,0.8)]">
                    Page {page + 1} of {totalPages}
                </p>
                <Button
                    size="small"
                    variant="outlined"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                >
                    Next
                </Button>
            </div>

            {/* Dialog: form to grant a subscription */}
            <Dialog open={grantDialogOpen} onClose={() => setGrantDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Grant Subscription</DialogTitle>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">
                        Grants a free subscription (no Stripe involved) to an existing user.
                    </p>
                    <TextField
                        label="User email"
                        fullWidth
                        value={grantEmail}
                        onChange={(event) => setGrantEmail(event.target.value)}
                    />
                    <p></p>
                    <TextField
                        label="Slots"
                        type="number"
                        fullWidth
                        value={grantSlots}
                        onChange={(event) => setGrantSlots(event.target.value)}
                        slotProps={{ htmlInput: { min: 1 } }}
                    />
                    {grantError && <Alert severity="error">{grantError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={() => setGrantDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" onClick={submitGrantForm} disabled={grantLoading}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: form to reactivate a subscription (slots only) */}
            <Dialog open={reactivateTarget !== null} onClose={() => setReactivateTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Reactivate Subscription</DialogTitle>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">
                        Reactivating a free subscription for {reactivateTarget?.email}. How many slots should it have?
                    </p>
                    <TextField
                        label="Slots"
                        type="number"
                        fullWidth
                        value={reactivateSlots}
                        onChange={(event) => setReactivateSlots(event.target.value)}
                        slotProps={{ htmlInput: { min: 1 } }}
                    />
                    {reactivateError && <Alert severity="error">{reactivateError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={() => setReactivateTarget(null)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" onClick={submitReactivateForm}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: form to update slots */}
            <Dialog open={slotsDialogTarget !== null} onClose={() => setSlotsDialogTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Update Slots</DialogTitle>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">
                        New slot count for {slotsDialogTarget?.email}. Currently using {slotsDialogTarget?.usedSlots}.
                    </p>
                    <TextField
                        label="Slots"
                        type="number"
                        fullWidth
                        value={slotsInput}
                        onChange={(event) => setSlotsInput(event.target.value)}
                        slotProps={{ htmlInput: { min: slotsDialogTarget?.usedSlots ?? 1 } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={() => setSlotsDialogTarget(null)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" onClick={submitSlotsForm}>
                        Continue
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog: generic confirmation for any action */}
            <Dialog open={pendingAction !== null} onClose={() => setPendingAction(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Confirm action</DialogTitle>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">{pendingActionMessage}</p>
                    {actionError && <Alert severity="error">{actionError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={() => setPendingAction(null)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="secondary" onClick={confirmPendingAction}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Subscriptions;
