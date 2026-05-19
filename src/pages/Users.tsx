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
    getUsersPage,
    grantAdmin,
    updateUserGems,
} from '../services/userService';
import { getCosmeticsByCategory, getCosmeticsCategories, normalizeCosmeticUrl } from '../services/assetsService';
import type { User, UserDetails, UserFilter } from '../services/userService';
import CosmeticsDialog from '../components/CosmeticsDialog';
import CosmeticPreviewDialog from '../components/CosmeticPreviewDialog';
import type { CosmeticPreviewItem } from '../components/CosmeticPreviewDialog';

const verifiedOptions: { label: string; value: UserFilter['verified'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' },
];

function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [filter, setFilter] = useState<UserFilter>({ query: '', verified: 'all' });
    const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
    const [usersPage, setUsersPage] = useState(0);
    const [usersTotal, setUsersTotal] = useState(0);
    const [gemDialogOpen, setGemDialogOpen] = useState(false);
    const [gemTarget, setGemTarget] = useState<User | null>(null);
    const [gemInput, setGemInput] = useState('');
    const [cosmeticsOpen, setCosmeticsOpen] = useState(false);
    const [cosmetics, setCosmetics] = useState<{ id: string; url: string }[]>([]);
    const [cosmeticsTotal, setCosmeticsTotal] = useState(0);
    const [cosmeticsPage, setCosmeticsPage] = useState(0);
    const [previewItem, setPreviewItem] = useState<CosmeticPreviewItem | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const cosmeticsPageSize = 12;
    const usersPageSize = 20;

    const loadUsers = async (nextFilter: UserFilter, page = usersPage) => {
        const response = await getUsersPage(nextFilter, page * usersPageSize, usersPageSize);
        setUsers(response.items);
        setUsersTotal(response.total);
    };

    useEffect(() => {
        loadUsers(filter, usersPage);
    }, [filter, usersPage]);

    const handleSelectUser = async (userId: string) => {
        const details = await getUserDetails(userId);
        setSelectedUser(details);
    };

    const handleOpenUserCosmetics = async (userId: string, page = 0) => {
        if (!userId) return;
        const categories = await getCosmeticsCategories();
        const offset = page * cosmeticsPageSize;
        const allCosmetics: { id: string; url: string }[] = [];
        let totalCount = 0;

        for (const cat of categories) {
            const result = await getCosmeticsByCategory(cat.category_id, {
                playerId: userId,
                offset: 0,
                limit: 1000,
            });
            allCosmetics.push(...result.items);
            totalCount += result.total;
        }

        setCosmetics(allCosmetics.slice(offset, offset + cosmeticsPageSize));
        setCosmeticsTotal(totalCount);
        setCosmeticsPage(page);
        setCosmeticsOpen(true);
    };

    const handleGrantAdmin = async (userId: string) => {
        await grantAdmin(userId);
        await loadUsers(filter, usersPage);
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
        await loadUsers(filter, usersPage);
        if (selectedUser?.id === gemTarget.id) {
            const details = await getUserDetails(gemTarget.id);
            setSelectedUser(details);
        }
        setGemDialogOpen(false);
    };

    const userCountLabel = useMemo(() => `${usersTotal} users`, [usersTotal]);
    const totalUserPages = Math.max(1, Math.ceil(usersTotal / usersPageSize));

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
                            onChange={(event) => {
                                setUsersPage(0);
                                setFilter({ ...filter, query: event.target.value });
                            }}
                        />
                        <Select
                            size="small"
                            value={filter.verified}
                            onChange={(event) => {
                                setUsersPage(0);
                                setFilter({
                                    ...filter,
                                    verified: event.target.value as UserFilter['verified'],
                                });
                            }}
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
                <div className="mt-4 flex items-center justify-between">
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={usersPage === 0}
                        onClick={() => setUsersPage((current) => Math.max(0, current - 1))}
                    >
                        Previous
                    </Button>
                    <p className="text-xs text-[rgba(184,176,214,0.8)]">
                        Page {usersPage + 1} of {totalUserPages}
                    </p>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={usersPage + 1 >= totalUserPages}
                        onClick={() => setUsersPage((current) => current + 1)}
                    >
                        Next
                    </Button>
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
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Cosmetics</p>
                            <p>Owned: {selectedUser.ownedSprites}</p>
                            <p>Wearing: {selectedUser.wearingSprites}</p>
                            {selectedUser.wearingSpriteUrls.length > 0 && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {selectedUser.wearingSpriteUrls.map((spriteUrl) => (
                                        <button
                                            key={spriteUrl}
                                            type="button"
                                            className="rounded border border-[#2a2640]"
                                            onClick={() => {
                                                const url = normalizeCosmeticUrl(spriteUrl);
                                                setPreviewItem({ id: spriteUrl, url });
                                                setPreviewOpen(true);
                                            }}
                                        >
                                            <img
                                                src={normalizeCosmeticUrl(spriteUrl)}
                                                alt="Cosmetic"
                                                className="cursor-pointer h-12 w-12 rounded object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                className="mt-3"
                                onClick={() => handleOpenUserCosmetics(selectedUser.id, 0)}
                            >
                                View All Cosmetics
                            </Button>
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
                        slotProps={{ htmlInput: { min: 0 } }}
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

            <CosmeticsDialog
                open={cosmeticsOpen}
                title={`User Cosmetics - ${selectedUser?.characterName ?? 'Player'}`}
                items={cosmetics}
                page={cosmeticsPage}
                total={cosmeticsTotal}
                pageSize={cosmeticsPageSize}
                onClose={() => setCosmeticsOpen(false)}
                onPrevious={() => handleOpenUserCosmetics(selectedUser?.id ?? '', cosmeticsPage - 1)}
                onNext={() => handleOpenUserCosmetics(selectedUser?.id ?? '', cosmeticsPage + 1)}
                onItemClick={(item) => {
                    setPreviewItem(item);
                    setPreviewOpen(true);
                }}
            />

            <CosmeticPreviewDialog
                open={previewOpen}
                item={previewItem}
                title={selectedUser ? `${selectedUser.characterName} Cosmetic` : 'Cosmetic Preview'}
                onClose={() => setPreviewOpen(false)}
            />
        </div>
    );
}

export default Users;
