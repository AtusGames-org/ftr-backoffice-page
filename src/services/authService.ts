import { delay } from './serviceUtils';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  await delay(600);
  return {
    token: 'mock-token',
    user: {
      id: 'admin-001',
      email,
      name: 'Realm Steward',
    },
  };
};
