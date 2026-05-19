import { delay } from './serviceUtils';

export interface MetricsSummary {
  totalPlayers: number;
  activePlayers: number;
  totalWorlds: number;
  worldsOnline: number;
  totalZones: number;
  onlineZones: number;
  avgZonesPerWorld: number;
  avgPlayerTime: number;
  gemsBought: number;
  gemsSpent: number;
  totalCosmetics: number;
  avgCosmeticPrice: number;
}

export const getMetricsSummary = async (): Promise<MetricsSummary> => {
  await delay(300);
  return {
    totalPlayers: 125430,
    activePlayers: 4380,
    totalWorlds: 12,
    worldsOnline: 9,
    totalZones: 148,
    onlineZones: 132,
    avgZonesPerWorld: 12.3,
    avgPlayerTime: 6.8,
    gemsBought: 920000,
    gemsSpent: 780000,
    totalCosmetics: 680,
    avgCosmeticPrice: 220,
  };
};
