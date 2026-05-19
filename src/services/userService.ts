import { apiRequest } from './apiClient';
import { getCosmeticById, getCosmeticsByCategory, getCosmeticsCategories } from './assetsService';
import { getCharacterInfo } from './playersService';
import { getAllCreatorBalances, getAllGemBalances, updateGemBalance } from './paymentService';

export type UserRole = 'player' | 'admin';

export interface User {
    id: string;
    email: string;
    verified: boolean;
    role: UserRole;
    totalGems: number;
}

export interface UserDetails {
    id: string;
    characterName: string;
    bio: string;
    ownedSprites: number;
    wearingSprites: number;
    wearingSpriteUrls: string[];
    totalGems: number;
    creatorBalance: number;
}

export interface UserFilter {
    query: string;
    verified: 'all' | 'verified' | 'unverified';
}

interface UserListResponse {
    users: { id: string; email: string; verified: boolean; is_admin: boolean }[];
    total_count: number;
}

interface PagedUsersResult {
    items: User[];
    total: number;
}

const fetchUsersPage = async (filter: UserFilter, offset: number, limit: number): Promise<PagedUsersResult> => {
    const params = new URLSearchParams();
    params.set('offset', String(offset));
    params.set('limit', String(limit));
    if (filter.query) {
        params.set('query', filter.query);
    }
    if (filter.verified !== 'all') {
        params.set('verified', filter.verified === 'verified' ? 'true' : 'false');
    }

    const [usersResponse, gemBalances] = await Promise.all([
        apiRequest<UserListResponse>(`/auth/users?${params}`),
        getAllGemBalances(),
    ]);

    const gemsByUser = new Map(gemBalances.map((balance) => [balance.user_id, balance.gems]));

    return {
        items: usersResponse.users.map((user) => ({
            id: user.id,
            email: user.email,
            verified: user.verified,
            role: user.is_admin ? 'admin' : 'player',
            totalGems: gemsByUser.get(user.id) ?? 0,
        })),
        total: usersResponse.total_count,
    };
};

export const getUsersPage = async (filter: UserFilter, offset = 0, limit = 20): Promise<PagedUsersResult> =>
    fetchUsersPage(filter, offset, limit);

export const getAllUsers = async (filter: UserFilter): Promise<User[]> => {
    const pageSize = 200;
    const users: User[] = [];
    let offset = 0;
    let total = Number.POSITIVE_INFINITY;

    while (offset < total) {
        const page = await fetchUsersPage(filter, offset, pageSize);
        users.push(...page.items);
        total = page.total;
        if (page.items.length === 0) {
            break;
        }
        offset += page.items.length;
    }

    return users;
};

export const getUsers = async (filter: UserFilter): Promise<User[]> => {
    return getAllUsers(filter);
};

export const getUserDetails = async (userId: string): Promise<UserDetails> => {
    const [characterInfo, gemBalances, creatorBalances] = await Promise.all([
        getCharacterInfo(userId),
        getAllGemBalances(),
        getAllCreatorBalances(),
    ]);

    const gems = gemBalances.find((balance) => balance.user_id === userId)?.gems ?? 0;
    const creatorBalance = creatorBalances.find((balance) => balance.user_id === userId)?.balance ?? 0;

    const categories = await getCosmeticsCategories();
    const ownedCounts = await Promise.all(
        categories.map((category) =>
            getCosmeticsByCategory(category.category_id, { playerId: userId, offset: 0, limit: 1 }),
        ),
    );

    const ownedSprites = ownedCounts.reduce((sum, entry) => sum + entry.total, 0);
    const wearingSpriteUrls = (
        await Promise.all(
            Object.values(characterInfo.category_sprites ?? {})
                .filter(Boolean)
                .map((spriteId) => getCosmeticById(spriteId).catch(() => null)),
        )
    )
        .filter((item): item is { id: string; url: string } => item !== null)
        .map((item) => item.url);

    return {
        id: userId,
        characterName: characterInfo.character_name,
        bio: characterInfo.character_bio,
        ownedSprites,
        wearingSprites: wearingSpriteUrls.length,
        wearingSpriteUrls,
        totalGems: gems,
        creatorBalance,
    };
};

export const grantAdmin = async (userId: string): Promise<void> => {
    await apiRequest<void>(`/auth/users/${userId}/admin`, {
        method: 'PUT',
        body: { is_admin: true },
    });
};

export const updateUserGems = async (userId: string, totalGems: number): Promise<void> => {
    await updateGemBalance(userId, totalGems);
};
