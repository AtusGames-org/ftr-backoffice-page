import { getAllCreatorBalances, getAllGemBalances } from './paymentService';
import { getUsers } from './userService';
import { getAllWorldPlayerCounts } from './worldPlayersService';
import { getWorlds } from './worldService';

export interface MetricsSummary {
    totalPlayers: number;
    activePlayers: number;
    totalWorlds: number;
    worldsOnline: number;
    totalZones: number;
    onlineZones: number;
    avgZonesPerWorld: number;
    avgPlayerTime: number | null;
    gemsBought: number | null;
    gemsSpent: number | null;
    totalCosmetics: number | null;
    avgCosmeticPrice: number | null;
    totalCreatorBalance: number;
    totalGemsInCirculation: number;
}

export const getMetricsSummary = async (): Promise<MetricsSummary> => {
    const [users, worlds, playerCounts, gemBalances, creatorBalances] = await Promise.all([
        getUsers({ query: '', verified: 'all' }),
        getWorlds({ query: '', status: 'all' }),
        getAllWorldPlayerCounts().catch(() => []),
        getAllGemBalances().catch(() => []),
        getAllCreatorBalances().catch(() => []),
    ]);

    const totalPlayers = users.length;
    const worldsOnline = worlds.filter((world) => world.status === 'online').length;
    const totalZones = worlds.reduce((sum, world) => sum + world.zoneCount, 0);
    const onlineZones = worlds.reduce((sum, world) => sum + world.onlineZoneCount, 0);
    const avgZonesPerWorld = worlds.length > 0 ? Number((totalZones / worlds.length).toFixed(1)) : 0;
    const activePlayers = playerCounts.reduce((sum, world) => sum + world.total_players, 0);
    const totalCreatorBalance = creatorBalances.reduce((sum, balance) => sum + balance.balance, 0);
    const totalGemsInCirculation = gemBalances.reduce((sum, balance) => sum + balance.gems, 0);

    return {
        totalPlayers,
        activePlayers,
        totalWorlds: worlds.length,
        worldsOnline,
        totalZones,
        onlineZones,
        avgZonesPerWorld,
        avgPlayerTime: null,
        gemsBought: null,
        gemsSpent: null,
        totalCosmetics: null,
        avgCosmeticPrice: null,
        totalCreatorBalance,
        totalGemsInCirculation,
    };
};
