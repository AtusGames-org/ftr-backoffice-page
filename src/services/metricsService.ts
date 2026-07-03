import {
  getAllCreatorBalances,
  getAllGemBalances,
  getGemMetrics,
} from "./paymentService";
import { getUsers } from "./userService";
import { getAllWorldPlayerCounts } from "./worldPlayersService";
import { getWorlds } from "./worldService";
import { getCosmeticsEconomySummary } from "./assetsService";

export interface MetricsSummary {
  totalPlayers: number;
  activePlayers: number;
  maxActivePlayers: number;
  totalWorlds: number;
  worldsOnline: number;
  totalZones: number;
  onlineZones: number;
  avgZonesPerWorld: number;
  avgPlayerTime: number | null;
  maxAvgPlayerTime: number | null;
  gemsBought: number | null;
  gemsSpent: number | null;
  gemsRevenue: number | null;
  gemsFlow: number | null;
  totalCosmetics: number | null;
  avgCosmeticPrice: number | null;
  defaultCosmetics: number;
  userCreatedCosmetics: number;
  totalCreatorBalance: number;
  totalGemsInCirculation: number;
  lastSyncTime: Date;
}

export const getMetricsSummary = async (): Promise<MetricsSummary> => {
  const [
    users,
    worlds,
    playerCounts,
    gemBalances,
    creatorBalances,
    cosmeticsSummary,
    gemMetrics,
  ] = await Promise.all([
    getUsers({ query: "", verified: "all" }),
    getWorlds({ query: "", status: "all" }),
    getAllWorldPlayerCounts().catch(() => null),
    getAllGemBalances().catch(() => []),
    getAllCreatorBalances().catch(() => []),
    getCosmeticsEconomySummary().catch(() => ({
      defaultCosmetics: 0,
      userCreatedCosmetics: 0,
      averagePrice: 0,
    })),
    getGemMetrics().catch(() => null),
  ]);

  const totalPlayers = users.length;
  const worldsOnline = worlds.filter(
    (world) => world.status === "online",
  ).length;
  const totalZones = worlds.reduce((sum, world) => sum + world.zoneCount, 0);
  const onlineZones = worlds.reduce(
    (sum, world) => sum + world.onlineZoneCount,
    0,
  );
  const avgZonesPerWorld =
    worlds.length > 0 ? Number((totalZones / worlds.length).toFixed(1)) : 0;
  const activePlayers = playerCounts?.active_players ?? 0;
  const avgPlayerTime = playerCounts ? playerCounts.average_player_time : null;
  const maxActivePlayers = playerCounts?.max_active_players ?? 0;
  const maxAvgPlayerTime = playerCounts ? playerCounts.max_average_player_time : null;
  const totalCreatorBalance = creatorBalances.reduce(
    (sum, balance) => sum + balance.balance,
    0,
  );
  const totalGemsInCirculation = gemBalances.reduce(
    (sum, balance) => sum + balance.gems,
    0,
  );

  return {
    totalPlayers,
    activePlayers,
    maxActivePlayers,
    totalWorlds: worlds.length,
    worldsOnline,
    totalZones,
    onlineZones,
    avgZonesPerWorld,
    avgPlayerTime,
    maxAvgPlayerTime,
    gemsBought: gemMetrics ? gemMetrics.gems_bought : null,
    gemsSpent: gemMetrics ? gemMetrics.gems_spent : null,
    gemsRevenue: gemMetrics ? gemMetrics.gems_revenue : null,
    gemsFlow: gemMetrics ? gemMetrics.gems_flow : null,
    totalCosmetics:
      cosmeticsSummary.defaultCosmetics + cosmeticsSummary.userCreatedCosmetics,
    avgCosmeticPrice: cosmeticsSummary.averagePrice,
    defaultCosmetics: cosmeticsSummary.defaultCosmetics,
    userCreatedCosmetics: cosmeticsSummary.userCreatedCosmetics,
    totalCreatorBalance,
    totalGemsInCirculation,
    lastSyncTime: new Date(),
  };
};
