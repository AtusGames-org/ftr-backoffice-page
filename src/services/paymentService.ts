import { apiRequest } from './apiClient';

export interface GemBalance {
  user_id: string;
  gems: number;
}

export interface CreatorBalance {
  user_id: string;
  balance: number;
}

export interface GemMetricsResponse {
  gems_bought: number;
  gems_spent: number;
  gems_revenue: number;
  gems_flow: number;
}

export const getAllGemBalances = async (): Promise<GemBalance[]> =>
  apiRequest<GemBalance[]>('/payments/gems/balances/all');

export const updateGemBalance = async (userId: string, gems: number): Promise<GemBalance> =>
  apiRequest<GemBalance>(`/payments/gems/balances/${userId}`, {
    method: 'PUT',
    body: { gems },
  });

export const getAllCreatorBalances = async (): Promise<CreatorBalance[]> =>
  apiRequest<CreatorBalance[]>('/payments/balances/creators/all');

export const getGemMetrics = async (): Promise<GemMetricsResponse> =>
  apiRequest<GemMetricsResponse>('/payments/gems/metrics');
