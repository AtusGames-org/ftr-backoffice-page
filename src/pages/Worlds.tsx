import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Dialog,
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
    getWorlds,
    getWorldZones,
    getZoneAddress,
    startZoneJob,
    stopZoneJob,
    World,
    WorldDetails,
    WorldFilter,
} from '../services/worldService';
import { getCosmeticsByWorld } from '../services/assetsService';
import { getAllWorldPlayerCounts, getWorldPlayerCounts } from '../services/worldPlayersService';

const statusOptions: { label: string; value: WorldFilter['status'] }[] = [
    { label: 'All', value: 'all' },
    { label: 'Online', value: 'online' },
    { label: 'Degraded', value: 'degraded' },
    { label: 'Offline', value: 'offline' },
];

function Worlds() {
    const [worlds, setWorlds] = useState<World[]>([]);
    const [filter, setFilter] = useState<WorldFilter>({ query: '', status: 'all' });
    const [selectedWorld, setSelectedWorld] = useState<WorldDetails | null>(null);
    const [cosmeticsOpen, setCosmeticsOpen] = useState(false);
    const [cosmetics, setCosmetics] = useState<{ id: string; url: string }[]>([]);
    const [cosmeticsTotal, setCosmeticsTotal] = useState(0);
    const [cosmeticsPage, setCosmeticsPage] = useState(0);
    const cosmeticsPageSize = 12;

    const loadWorlds = async (nextFilter: WorldFilter) => {
        const [data, playerCounts] = await Promise.all([
            getWorlds(nextFilter),
            getAllWorldPlayerCounts().catch(() => []),
        ]);
        const countByWorld = new Map(playerCounts.map((entry) => [entry.world_id, entry.total_players]));
        const merged = data.map((world) => ({
            ...world,
            activePlayers: countByWorld.get(world.id) ?? 0,
        }));
        setWorlds(merged);
    };

    useEffect(() => {
        loadWorlds(filter);
    }, [filter]);

    const handleSelectWorld = async (worldId: string) => {
        setCosmetics([]);
        setCosmeticsTotal(0);
        setCosmeticsPage(0);
        const [zones, playerCounts] = await Promise.all([
            getWorldZones(worldId),
            getWorldPlayerCounts(worldId).catch(() => null),
        ]);

        const zoneCounts = new Map(
            playerCounts?.zones.map((zone) => [zone.zone_id, zone.active_players]) ?? [],
        );

        const zonesWithCounts = await Promise.all(
            zones.map(async (zone) => {
                const address = zone.isOnline ? await getZoneAddress(worldId, zone.id).catch(() => undefined) : undefined;
                return {
                    ...zone,
                    activePlayers: zoneCounts.get(zone.id) ?? 0,
                    address,
                };
            }),
        );

        const worldName = worlds.find((world) => world.id === worldId)?.name ?? 'World';
        setSelectedWorld({ id: worldId, name: worldName, zones: zonesWithCounts });
    };

    const handleToggleZone = async (worldId: string, zoneId: number, isOnline: boolean) => {
        if (isOnline) {
            await stopZoneJob(worldId, zoneId);
        } else {
            await startZoneJob(worldId, zoneId);
        }
        await handleSelectWorld(worldId);
    };

    const handleOpenCosmetics = async (worldId: string, page = 0) => {
        if (!worldId) {
            return;
        }
        const offset = page * cosmeticsPageSize;
        const list = await getCosmeticsByWorld(worldId, offset, cosmeticsPageSize);
        setCosmetics(list.items);
        setCosmeticsTotal(list.total);
        setCosmeticsPage(page);
        setCosmeticsOpen(true);
    };

    const worldCountLabel = useMemo(() => `${worlds.length} worlds`, [worlds.length]);

    return (
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <section className="app-card p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="app-title text-2xl">World Control</h2>
                        <p className="text-sm text-[rgba(184,176,214,0.8)]">{worldCountLabel} matching filters.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <TextField
                            label="Search by name"
                            size="small"
                            value={filter.query}
                            onChange={(event) => setFilter({ ...filter, query: event.target.value })}
                        />
                        <Select
                            size="small"
                            value={filter.status}
                            onChange={(event) =>
                                setFilter({
                                    ...filter,
                                    status: event.target.value as WorldFilter['status'],
                                })
                            }
                        >
                            {statusOptions.map((option) => (
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
                                <TableCell>Name</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Active Players</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {worlds.map((world) => (
                                <TableRow key={world.id} hover>
                                    <TableCell>{world.name}</TableCell>
                                    <TableCell>{world.status}</TableCell>
                                    <TableCell>{world.activePlayers}</TableCell>
                                    <TableCell align="right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="small" variant="text" onClick={() => handleSelectWorld(world.id)}>
                                                Details
                                            </Button>
                                            <Button size="small" variant="outlined" color="secondary">
                                                Notify
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
                <h3 className="app-title text-xl">World Detail</h3>
                {!selectedWorld && (
                    <p className="mt-4 text-sm text-[rgba(184,176,214,0.8)]">Select a world to review zones and assets.</p>
                )}
                {selectedWorld && (
                    <div className="mt-4 space-y-4 text-sm">
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Zones</p>
                            <div className="mt-2 space-y-2">
                                {selectedWorld.zones.map((zone) => (
                                    <div key={zone.id} className="rounded-lg border border-[#2a2640] px-3 py-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-[#f8f5ff]">{zone.name}</p>
                                                <p className="text-xs text-[rgba(184,176,214,0.8)]">
                                                    {zone.isActive ? 'Active' : 'Inactive'} - {zone.isOnline ? 'Online' : 'Offline'}
                                                </p>
                                                {zone.address && (
                                                    <p className="text-xs text-[rgba(184,176,214,0.8)]">{zone.address}</p>
                                                )}
                                                <p className="text-xs text-[rgba(184,176,214,0.8)]">
                                                    Active players: {zone.activePlayers ?? 0}
                                                </p>
                                            </div>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color={zone.isOnline ? 'secondary' : 'primary'}
                                                onClick={() => handleToggleZone(selectedWorld.id, zone.id, zone.isOnline)}
                                            >
                                                {zone.isOnline ? 'Stop Job' : 'Start Job'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-[#6ae4ff]">Cosmetics</p>
                            <p>Total: {cosmeticsTotal || 'Unknown'}</p>
                            <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleOpenCosmetics(selectedWorld.id, 0)}
                            >
                                View Cosmetics
                            </Button>
                        </div>
                    </div>
                )}
            </aside>

            <Dialog open={cosmeticsOpen} onClose={() => setCosmeticsOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Cosmetics List</DialogTitle>
                <DialogContent>
                    <div className="grid grid-cols-3 gap-3">
                        {cosmetics.map((item) => (
                            <div key={item.id} className="rounded-lg border border-[#2a2640] p-2 text-sm">
                                <img src={item.url} alt="Cosmetic" className="h-20 w-full rounded object-cover" />
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={cosmeticsPage === 0}
                            onClick={() => handleOpenCosmetics(selectedWorld?.id ?? '', cosmeticsPage - 1)}
                        >
                            Previous
                        </Button>
                        <p className="text-xs text-[rgba(184,176,214,0.8)]">
                            Page {cosmeticsPage + 1} of {Math.max(1, Math.ceil(cosmeticsTotal / cosmeticsPageSize))}
                        </p>
                        <Button
                            size="small"
                            variant="outlined"
                            disabled={(cosmeticsPage + 1) * cosmeticsPageSize >= cosmeticsTotal}
                            onClick={() => handleOpenCosmetics(selectedWorld?.id ?? '', cosmeticsPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Worlds;
