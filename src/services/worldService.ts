import { apiRequest } from './apiClient';

export type WorldStatus = 'online' | 'degraded' | 'offline';

export interface World {
    id: string;
    name: string;
    status: WorldStatus;
    activePlayers: number;
    zoneCount: number;
    onlineZoneCount: number;
}

export interface WorldFilter {
    query: string;
    status: 'all' | WorldStatus;
}

export interface Zone {
    id: number;
    name: string;
    isActive: boolean;
    isOnline: boolean;
    address?: string;
    activePlayers?: number;
}

export interface WorldDetails {
    id: string;
    name: string;
    zones: Zone[];
}

interface WorldMetadata {
    id: string;
    name: string;
    description?: string;
    zones: { zone_id: number; is_active: boolean; is_online: boolean }[];
}

interface WorldsListResponse {
    worlds: WorldMetadata[];
    amount: number;
    limit: number;
    offset: number;
}

export const getWorlds = async (filter: WorldFilter): Promise<World[]> => {
    const params = new URLSearchParams();
    params.set('offset', '0');
    params.set('limit', '100');
    if (filter.query) {
        params.set('filter', filter.query);
    }
    const response = await apiRequest<WorldsListResponse>(`/world?${params}`);
    const mapped = response.worlds.map((world) => ({
        id: world.id,
        name: world.name,
        status: deriveStatus(world.zones),
        activePlayers: 0,
        zoneCount: world.zones.length,
        onlineZoneCount: world.zones.filter((zone) => zone.is_online).length,
    }));
    return filter.status === 'all'
        ? mapped
        : mapped.filter((world) => world.status === filter.status);
};

export const getWorldZones = async (worldId: string): Promise<Zone[]> => {
    const response = await apiRequest<{ world_id: string; zones: { zone_id: number; is_active: boolean; is_online: boolean }[] }>(
        `/world/${worldId}/zones`,
    );
    return response.zones.map((zone) => ({
        id: zone.zone_id,
        name: `Zone ${zone.zone_id}`,
        isActive: zone.is_active,
        isOnline: zone.is_online,
    }));
};

export const startZoneJob = async (worldId: string, zoneId: number) =>
    apiRequest<void>(`/world/orchestrator/${worldId}/zones/${zoneId}/start-job`, { method: 'GET' });

export const stopZoneJob = async (worldId: string, zoneId: number) =>
    apiRequest<void>(`/world/orchestrator/${worldId}/zones/${zoneId}/stop-job`, { method: 'GET' });

export const getZoneAddress = async (worldId: string, zoneId: number): Promise<string> => {
    const response = await apiRequest<{ ip: string; port: number }>(
        `/world/orchestrator/${worldId}/zones/${zoneId}/address`,
    );
    return `${response.ip}:${response.port}`;
};

const deriveStatus = (zones: { is_active: boolean; is_online: boolean }[]): WorldStatus => {
    const hasOnline = zones.some((zone) => zone.is_online);
    if (hasOnline) {
        return 'online';
    }
    const hasActive = zones.some((zone) => zone.is_active);
    return hasActive ? 'degraded' : 'offline';
};
