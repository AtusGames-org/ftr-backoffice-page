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
} from '../services/worldService';
import { getCosmeticsByWorld } from '../services/assetsService';
import { getAllWorldPlayerCounts, getWorldPlayerCounts } from '../services/worldPlayersService';
import CosmeticsDialog from '../components/CosmeticsDialog';
import type { World, WorldDetails, WorldFilter } from '../services/worldService';

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
    const [worldCosmeticsTotal, setWorldCosmeticsTotal] = useState(0);
    const [cosmeticsOpen, setCosmeticsOpen] = useState(false);
    const [cosmetics, setCosmetics] = useState<{ id: string; url: string }[]>([]);
    const [cosmeticsTotal, setCosmeticsTotal] = useState(0);
    const [cosmeticsPage, setCosmeticsPage] = useState(0);
    const cosmeticsPageSize = 12;
    const [startJobDialog, setStartJobDialog] = useState<{ open: boolean; worldId: string; zoneId: number } | null>(null);
    const [isTestMode, setIsTestMode] = useState(false);
    const [worldPage, setWorldPage] = useState(0);
    const worldPageSize = 10;

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
        setWorldCosmeticsTotal(0);
        const [zones, playerCounts, cosmeticsSummary] = await Promise.all([
            getWorldZones(worldId),
            getWorldPlayerCounts(worldId).catch(() => null),
            getCosmeticsByWorld(worldId, 0, 1).catch(() => ({ total: 0 })),
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
        setWorldCosmeticsTotal(cosmeticsSummary.total);
    };

    const handleToggleZone = async (worldId: string, zoneId: number, isOnline: boolean) => {
        if (isOnline) {
            await stopZoneJob(worldId, zoneId);
            await handleSelectWorld(worldId);
        } else {
            setStartJobDialog({ open: true, worldId, zoneId });
            setIsTestMode(false);
        }
    };

    const handleStartJob = async () => {
        if (!startJobDialog) return;
        try {
            await startZoneJob(startJobDialog.worldId, startJobDialog.zoneId, isTestMode);
            setStartJobDialog(null);
            await handleSelectWorld(startJobDialog.worldId);
        } catch (err) {
            console.error('Failed to start job', err);
        }
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

    const filteredWorlds = useMemo(
        () => worlds.filter((world) => (filter.status === 'all' ? true : world.status === filter.status)),
        [filter.status, worlds],
    );
    const visibleWorlds = useMemo(
        () => filteredWorlds.slice(worldPage * worldPageSize, worldPage * worldPageSize + worldPageSize),
        [filteredWorlds, worldPage],
    );
    const worldCountLabel = useMemo(() => `${filteredWorlds.length} worlds`, [filteredWorlds.length]);
    const worldTotalPages = Math.max(1, Math.ceil(filteredWorlds.length / worldPageSize));

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
                            onChange={(event) => {
                                setWorldPage(0);
                                setFilter({ ...filter, query: event.target.value });
                            }}
                        />
                        <Select
                            size="small"
                            value={filter.status}
                            onChange={(event) => {
                                setWorldPage(0);
                                setFilter({
                                    ...filter,
                                    status: event.target.value as WorldFilter['status'],
                                });
                            }
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
                            {visibleWorlds.map((world) => (
                                <TableRow key={world.id} hover>
                                    <TableCell>{world.name}</TableCell>
                                    <TableCell>{world.status}</TableCell>
                                    <TableCell>{world.activePlayers}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" variant="text" onClick={() => handleSelectWorld(world.id)}>
                                            Details
                                        </Button>
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
                        disabled={worldPage === 0}
                        onClick={() => setWorldPage((current) => Math.max(0, current - 1))}
                    >
                        Previous
                    </Button>
                    <p className="text-xs text-[rgba(184,176,214,0.8)]">
                        Page {worldPage + 1} of {worldTotalPages}
                    </p>
                    <Button
                        size="small"
                        variant="outlined"
                        disabled={worldPage + 1 >= worldTotalPages}
                        onClick={() => setWorldPage((current) => current + 1)}
                    >
                        Next
                    </Button>
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
                            <p>Total: {worldCosmeticsTotal}</p>
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

            <CosmeticsDialog
                open={cosmeticsOpen}
                title={`Cosmetics List - ${selectedWorld?.name ?? 'World'}`}
                items={cosmetics}
                page={cosmeticsPage}
                total={cosmeticsTotal}
                pageSize={cosmeticsPageSize}
                onClose={() => setCosmeticsOpen(false)}
                onPrevious={() => handleOpenCosmetics(selectedWorld?.id ?? '', cosmeticsPage - 1)}
                onNext={() => handleOpenCosmetics(selectedWorld?.id ?? '', cosmeticsPage + 1)}
            />

            <Dialog open={startJobDialog?.open ?? false} onClose={() => setStartJobDialog(null)}>
                <DialogTitle>Start Zone Job</DialogTitle>
                <DialogContent>
                    <div className="space-y-4 py-4">
                        <p className="text-sm">Zone {startJobDialog?.zoneId} - World {selectedWorld?.name}</p>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={isTestMode}
                                onChange={(e) => setIsTestMode(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <span className="text-sm">Start in test mode</span>
                        </label>
                    </div>
                </DialogContent>
                <div className="flex justify-end gap-2 p-4">
                    <Button onClick={() => setStartJobDialog(null)} variant="outlined">
                        Cancel
                    </Button>
                    <Button onClick={handleStartJob} variant="contained" color="primary">
                        Start Job
                    </Button>
                </div>
            </Dialog>
        </div>
    );
}

export default Worlds;
