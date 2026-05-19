import { delay } from './serviceUtils';

export type WorldStatus = 'online' | 'degraded' | 'offline';

export interface World {
    id: string;
    name: string;
    status: WorldStatus;
    activePlayers: number;
}

export interface WorldFilter {
    query: string;
    status: 'all' | WorldStatus;
}

export interface Zone {
    id: string;
    name: string;
    isActive: boolean;
    isOnline: boolean;
}

export interface WorldDetails {
    id: string;
    name: string;
    zones: Zone[];
    assets: {
        models: number;
        items: number;
        materials: number;
    };
    cosmeticsCount: number;
}

const worlds: World[] = [
    { id: 'w-001', name: 'Ashen Reach', status: 'online', activePlayers: 420 },
    { id: 'w-002', name: 'Crystal Verge', status: 'degraded', activePlayers: 126 },
    { id: 'w-003', name: 'Obsidian Hollow', status: 'online', activePlayers: 310 },
    { id: 'w-004', name: 'Gilded Basin', status: 'offline', activePlayers: 0 },
    { id: 'w-005', name: 'Stormkeep', status: 'online', activePlayers: 205 },
];

let worldDetails: WorldDetails[] = [
    {
        id: 'w-001',
        name: 'Ashen Reach',
        zones: [
            { id: 'z-101', name: 'Emberfall', isActive: true, isOnline: true },
            { id: 'z-102', name: 'Cinder Wall', isActive: true, isOnline: true },
            { id: 'z-103', name: 'Blight Hollow', isActive: false, isOnline: false },
        ],
        assets: { models: 420, items: 1260, materials: 680 },
        cosmeticsCount: 210,
    },
    {
        id: 'w-002',
        name: 'Crystal Verge',
        zones: [
            { id: 'z-201', name: 'Glassmoor', isActive: true, isOnline: false },
            { id: 'z-202', name: 'Shardfall', isActive: true, isOnline: true },
            { id: 'z-203', name: 'Lumen Gate', isActive: false, isOnline: false },
        ],
        assets: { models: 310, items: 980, materials: 540 },
        cosmeticsCount: 144,
    },
    {
        id: 'w-003',
        name: 'Obsidian Hollow',
        zones: [
            { id: 'z-301', name: 'Blackforge', isActive: true, isOnline: true },
            { id: 'z-302', name: 'Veil Depths', isActive: true, isOnline: true },
            { id: 'z-303', name: 'Dread Maw', isActive: true, isOnline: false },
        ],
        assets: { models: 510, items: 1480, materials: 790 },
        cosmeticsCount: 280,
    },
    {
        id: 'w-004',
        name: 'Gilded Basin',
        zones: [
            { id: 'z-401', name: 'Sunken Court', isActive: false, isOnline: false },
            { id: 'z-402', name: 'Brass Harbor', isActive: false, isOnline: false },
        ],
        assets: { models: 190, items: 420, materials: 210 },
        cosmeticsCount: 88,
    },
    {
        id: 'w-005',
        name: 'Stormkeep',
        zones: [
            { id: 'z-501', name: 'Thunder Rise', isActive: true, isOnline: true },
            { id: 'z-502', name: 'Sky Bastion', isActive: true, isOnline: true },
            { id: 'z-503', name: 'Tempest Run', isActive: true, isOnline: false },
        ],
        assets: { models: 360, items: 1040, materials: 610 },
        cosmeticsCount: 172,
    },
];

const cosmeticsByWorld: Record<string, string[]> = {
    'w-001': ['Phoenix Mantle', 'Cinder Crown', 'Lavawalker Boots', 'Molten Edge'],
    'w-002': ['Crystal Veil', 'Shardsong Robe', 'Prism Lance', 'Gleam Pendant'],
    'w-003': ['Obsidian Helm', 'Shadowweave Cloak', 'Voidfang Blades'],
    'w-004': ['Gilded Mantle', 'Sunken Crown', 'Auric Talon'],
    'w-005': ['Stormcaller Cloak', 'Tempest Grips', 'Skyfire Mask'],
};

export const getWorlds = async (filter: WorldFilter): Promise<World[]> => {
    await delay(300);
    const query = filter.query.trim().toLowerCase();

    return worlds.filter((world) => {
        const matchesQuery = query ? world.name.toLowerCase().includes(query) : true;
        const matchesStatus = filter.status === 'all' ? true : world.status === filter.status;
        return matchesQuery && matchesStatus;
    });
};

export const getWorldDetails = async (worldId: string): Promise<WorldDetails> => {
    await delay(250);
    const details = worldDetails.find((world) => world.id === worldId);
    if (!details) {
        throw new Error('World not found');
    }
    return details;
};

export const getWorldCosmetics = async (worldId: string): Promise<string[]> => {
    await delay(200);
    return cosmeticsByWorld[worldId] ?? [];
};

export const toggleZoneJob = async (
    worldId: string,
    zoneId: string,
    action: 'start' | 'stop',
): Promise<void> => {
    await delay(200);
    worldDetails = worldDetails.map((world) => {
        if (world.id !== worldId) {
            return world;
        }
        return {
            ...world,
            zones: world.zones.map((zone) =>
                zone.id === zoneId
                    ? {
                        ...zone,
                        isOnline: action === 'start',
                    }
                    : zone,
            ),
        };
    });
};
