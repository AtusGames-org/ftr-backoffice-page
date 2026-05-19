import { apiRequest } from './apiClient';
import { getCosmeticsByCategory, getCosmeticsCategories } from './assetsService';
import { cosmeticsCdnBaseUrl } from './config';
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

export const getUsers = async (filter: UserFilter): Promise<User[]> => {
    const params = new URLSearchParams();
    params.set('offset', '0');
    params.set('limit', '200');
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

    return usersResponse.users.map((user) => ({
        id: user.id,
        email: user.email,
        verified: user.verified,
        role: user.is_admin ? 'admin' : 'player',
        totalGems: gemsByUser.get(user.id) ?? 0,
    }));
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
    const base = cosmeticsCdnBaseUrl.replace(/\/$/, '');
    const wearingSpriteUrls = Object.values(characterInfo.category_sprites ?? {})
        .filter(Boolean)
        .map((uri) => (uri.startsWith('http') ? uri : `${base}/${uri.replace(/^\//, '')}`));

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
