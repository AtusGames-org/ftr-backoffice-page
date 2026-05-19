import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Select,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import {
    getUserDetails,
    getUsers,
    grantAdmin,
    User,
    UserDetails,
    UserFilter,
    updateUserGems,
} from '../services/userService';

const verifiedOptions: { label: string; value: UserFilter['verified'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' },
];

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState<UserFilter>({ query: '', verified: 'all' });
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
    const [gemDialogOpen, setGemDialogOpen] = useState(false);
    const [gemTarget, setGemTarget] = useState<User | null>(null);
    const [gemInput, setGemInput] = useState('');

    const loadUsers = async (nextFilter: UserFilter) => {
        const data = await getUsers(nextFilter);
        setUsers(data);
    };

    useEffect(() => {
        loadUsers(filter);
    }, [filter]);

    const handleSelectUser = async (userId: string) => {
        const details = await getUserDetails(userId);
        setSelectedUser(details);
    };

    const handleGrantAdmin = async (userId: string) => {
        await grantAdmin(userId);
        await loadUsers(filter);
        if (selectedUser?.id === userId) {
            const details = await getUserDetails(userId);
            setSelectedUser(details);
        }
    };

    const handleOpenGemsDialog = (user: User) => {
        setGemTarget(user);
        setGemInput(user.totalGems.toString());
        setGemDialogOpen(true);
    };

    const handleSaveGems = async () => {
        if (!gemTarget) {
            return;
        }
        const nextValue = Number.parseInt(gemInput, 10);
        if (Number.isNaN(nextValue) || nextValue < 0) {
            return;
        }
        await updateUserGems(gemTarget.id, nextValue);
        await loadUsers(filter);
        if (selectedUser?.id === gemTarget.id) {
            const details = await getUserDetails(gemTarget.id);
            setSelectedUser(details);
        }
        setGemDialogOpen(false);
    };

    const userCountLabel = useMemo(() => `${users.length} users`, [users.length]);

    return (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <section className="app-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="app-title text-2xl">User Registry</h2>
                        <p className="text-sm text-[rgba(184,176,214,0.8)]">{userCountLabel} matching filters.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <TextField
                            label="Search by email"
                            size="small"
                            value={filter.query}
                            onChange={(event) => setFilter({ ...filter, query: event.target.value })}
                        />
                        <Select
                            size="small"
                            value={filter.verified}
                            onChange={(event) =>
                                setFilter({
                                    ...filter,
                                    verified: event.target.value as UserFilter['verified'],
                                })
                            }
                        >
                            {verifiedOptions.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-lg border border-[#2a2640]">
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Verified</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Total Gems</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.verified ? 'Verified' : 'Pending'}</TableCell>
                                    <TableCell>{user.role === 'admin' ? 'Admin' : 'Player'}</TableCell>
                                    <TableCell>{user.totalGems.toLocaleString()}</TableCell>
                                    <TableCell align="right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="small" variant="text" onClick={() => handleSelectUser(user.id)}>
                                                Details
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleOpenGemsDialog(user)}
                                            >
                                                Update Gems
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="secondary"
                                                disabled={user.role === 'admin'}
                                                onClick={() => handleGrantAdmin(user.id)}
                                            >
                                                Grant Admin
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </section>

            <aside className="app-card p-6">
                <h3 className="app-title text-xl">User Detail</h3>
                {!selectedUser && (
                    <p className="mt-4 text-sm text-[rgba(184,176,214,0.8)]">Select a user to inspect their profile.</p>
                )}
                {selectedUser && (
                    <div className="mt-4 space-y-4 text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Character</p>
                            <p className="text-lg font-semibold text-[#f8f5ff]">{selectedUser.characterName}</p>
                            <p className="text-[rgba(184,176,214,0.8)]">{selectedUser.bio}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Sprites</p>
                            <p>Owned: {selectedUser.ownedSprites}</p>
                            <p>Wearing: {selectedUser.wearingSprites}</p>
                            {selectedUser.wearingSpriteUrls.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {selectedUser.wearingSpriteUrls.map((spriteUrl) => (
                                        <img
                                            key={spriteUrl}
                                            src={spriteUrl}
                                            alt="Cosmetic"
                                            className="h-12 w-12 rounded border border-[#2a2640] object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Gems</p>
                            <p className="text-lg font-semibold text-[#f8f5ff]">{selectedUser.totalGems.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Creator Balance</p>
                            <p className="text-lg font-semibold text-[#f8f5ff]">${selectedUser.creatorBalance.toFixed(2)}</p>
                        </div>
                    </div>
                )}
            </aside>

            <Dialog open={gemDialogOpen} onClose={() => setGemDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Update Gems Balance</DialogTitle>
                <DialogContent className="space-y-4">
                    <p className="text-sm text-[rgba(184,176,214,0.8)]">
                        Set the new total gems balance for {gemTarget?.email ?? 'user'}.
                    </p>
                    <TextField
                        label="Total Gems"
                        type="number"
                        value={gemInput}
                        onChange={(event) => setGemInput(event.target.value)}
                        inputProps={{ min: 0 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button variant="text" onClick={() => setGemDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleSaveGems}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default Users;
