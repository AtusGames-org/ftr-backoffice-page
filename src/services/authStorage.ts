const ACCESS_TOKEN_KEY = 'ftr_access_token';
const REFRESH_TOKEN_KEY = 'ftr_refresh_token';
const EMAIL_KEY = 'ftr_user_email';

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getEmail: () => localStorage.getItem(EMAIL_KEY),
  setSession: (accessToken: string, refreshToken: string, email: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(EMAIL_KEY, email);
  },
  clearSession: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  },
};
