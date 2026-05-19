import { apiRequest } from './apiClient';

export interface ZonePlayerCount {
  zone_id: number;
  active_players: number;
  updated_at: string;
}

export interface WorldPlayerCounts {
  world_id: string;
  total_players: number;
  zones: ZonePlayerCount[];
}

export const getAllWorldPlayerCounts = async (): Promise<WorldPlayerCounts[]> =>
  apiRequest<WorldPlayerCounts[]>('/world/orchestrator/players');

export const getWorldPlayerCounts = async (worldId: string): Promise<WorldPlayerCounts> =>
  apiRequest<WorldPlayerCounts>(`/world/orchestrator/${worldId}/players`);
