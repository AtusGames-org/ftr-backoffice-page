import { apiRequest } from './apiClient';
import { cosmeticsCdnBaseUrl } from './config';

export interface CosmeticCategory {
  category_id: string;
  category_name: string;
}

export interface CosmeticListResponse {
  cosmetics_list: { cosmetic_id: string; cosmetic_url: string }[];
  total_count: number;
}

export interface CosmeticResponse {
  cosmetic_id: string;
  cosmetic_url: string;
}

export interface InternalCosmeticResponse {
  cosmetic_id: string;
  cosmetic_price: number;
  created_by: string;
}

export interface CosmeticsEconomySummary {
  defaultCosmetics: number;
  userCreatedCosmetics: number;
  averagePrice: number;
}

interface CosmeticsEconomySummaryResponse {
  default_cosmetics: number;
  user_created_cosmetics: number;
  average_price: number;
}

export const normalizeCosmeticUrl = (uri: string) => {
  if (!uri) {
    return '';
  }
  const base = cosmeticsCdnBaseUrl.replace(/\/$/, '');
  return uri.startsWith('http') ? uri : `${base}/${uri.replace(/^\//, '')}`;
};

export const getCosmeticsCategories = async (): Promise<CosmeticCategory[]> => {
  const response = await apiRequest<{ category_list: CosmeticCategory[] }>('/assets/cosmetics/categories');
  return response.category_list ?? [];
};

export const getCosmeticByIdInternal = async (cosmeticId: string): Promise<InternalCosmeticResponse> =>
  apiRequest<InternalCosmeticResponse>(`/assets/internal/cosmetics/${cosmeticId}`);

export const getCosmeticById = async (cosmeticId: string): Promise<{ id: string; url: string }> => {
  const response = await apiRequest<CosmeticResponse>(`/assets/cosmetics/${cosmeticId}`);
  return {
    id: response.cosmetic_id ?? cosmeticId,
    url: normalizeCosmeticUrl(response.cosmetic_url ?? ''),
  };
};

export const getCosmeticsByCategory = async (
  categoryId: string,
  options: { offset?: number; limit?: number; worldId?: string; playerId?: string } = {},
): Promise<{ items: { id: string; url: string }[]; total: number }> => {
  const params = new URLSearchParams();
  params.set('offset', String(options.offset ?? 0));
  params.set('limit', String(options.limit ?? 24));
  if (options.worldId) {
    params.set('world_id', options.worldId);
  }
  if (options.playerId) {
    params.set('player_id', options.playerId);
  }
  const response = await apiRequest<CosmeticListResponse>(`/assets/cosmetics/categories/${categoryId}?${params}`);
  return {
    items: response.cosmetics_list.map((item) => ({
      id: item.cosmetic_id,
      url: normalizeCosmeticUrl(item.cosmetic_url),
    })),
    total: response.total_count,
  };
};

export const getCosmeticsByWorld = async (
  worldId: string,
  offset = 0,
  limit = 24,
): Promise<{ items: { id: string; url: string; world?: string }[]; total: number }> => {
  const response = await apiRequest<CosmeticListResponse>(
    `/assets/cosmetics/worlds/${worldId}?offset=${offset}&limit=${limit}`,
  );
  return {
    items: response.cosmetics_list.map((item) => ({
      id: item.cosmetic_id,
      url: normalizeCosmeticUrl(item.cosmetic_url),
    })),
    total: response.total_count,
  };
};

export const getCosmeticsEconomySummary = async (): Promise<CosmeticsEconomySummary> => {
  const response = await apiRequest<CosmeticsEconomySummaryResponse>('/assets/cosmetics/economy-summary');
  return {
    defaultCosmetics: response.default_cosmetics ?? 0,
    userCreatedCosmetics: response.user_created_cosmetics ?? 0,
    averagePrice: response.average_price ?? 0,
  };
};
