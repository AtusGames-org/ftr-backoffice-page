import { apiRequest } from './apiClient';

export interface PlayerCounts {
    active_players: number;
    average_player_time: number;
}

export const getAllWorldPlayerCounts = async (): Promise<PlayerCounts> =>
    apiRequest<PlayerCounts>('/world/orchestrator/players');

export const getWorldPlayerCounts = async (worldId: string): Promise<PlayerCounts> =>
    apiRequest<PlayerCounts>(`/world/orchestrator/${worldId}/players`);
