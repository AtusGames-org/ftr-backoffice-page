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

const normalizeCosmeticUrl = (uri: string) => {
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
): Promise<{ items: { id: string; url: string }[]; total: number }> => {
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
