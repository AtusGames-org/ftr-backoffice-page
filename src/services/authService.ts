import { apiRequest } from './apiClient';
import { authStorage } from './authStorage';

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    id: string;
    email: string;
}

export interface SessionStatusResponse {
    user_id: string;
    is_admin: boolean;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuth: true,
    });
    authStorage.setSession(response.access_token, response.refresh_token, response.email);
    return response;
};

export const logout = () => {
    authStorage.clearSession();
};

export const verifyAdminSession = async (): Promise<SessionStatusResponse> =>
    apiRequest<SessionStatusResponse>('/auth/session');
