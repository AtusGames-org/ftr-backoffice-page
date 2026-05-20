import { apiRequest } from './apiClient';

export type WorldStatus = 'online' | 'degraded' | 'offline';

export interface World {
    id: string;
    name: string;
    status: WorldStatus;
    activePlayers: number | null;
    zoneCount: number;
    onlineZoneCount: number;
}

export interface WorldFilter {
    query: string;
    status: 'all' | WorldStatus;
}

export interface WorldPagination {
    offset?: number;
    limit?: number;
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

const fetchWorldsPage = async (filter: WorldFilter, pagination: Required<WorldPagination>): Promise<{ items: World[]; total: number }> => {
    const params = new URLSearchParams();
    params.set('offset', String(pagination.offset));
    params.set('limit', String(pagination.limit));
    if (filter.query) {
        params.set('filter', filter.query);
    }
    const response = await apiRequest<WorldsListResponse>(`/world?${params}`);
    return {
        items: response.worlds.map((world) => ({
            id: world.id,
            name: world.name,
            status: deriveStatus(world.zones),
            activePlayers: null,
            zoneCount: world.zones.length,
            onlineZoneCount: world.zones.filter((zone) => zone.is_online).length,
        })),
        total: response.amount,
    };
};

export const getWorldsPage = async (filter: WorldFilter, pagination: WorldPagination = {}): Promise<{ items: World[]; total: number }> =>
    fetchWorldsPage(filter, {
        offset: pagination.offset ?? 0,
        limit: pagination.limit ?? 20,
    });

export const getAllWorlds = async (filter: WorldFilter): Promise<World[]> => {
    const pageSize = 100;
    const items: World[] = [];
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (offset < total) {
        const page = await fetchWorldsPage(filter, { offset, limit: pageSize });
        items.push(...page.items);
        total = page.total;
        if (page.items.length === 0) {
            break;
        }
        offset += page.items.length;
    }

    return filter.status === 'all' ? items : items.filter((world) => world.status === filter.status);
};

export const getWorlds = async (filter: WorldFilter): Promise<World[]> => getAllWorlds(filter);

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

export const startZoneJob = async (worldId: string, zoneId: number, isTest: boolean = false) =>
    apiRequest<void>(`/world/orchestrator/${worldId}/zones/${zoneId}/start-job?test=${isTest}`, { method: 'GET' });

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
