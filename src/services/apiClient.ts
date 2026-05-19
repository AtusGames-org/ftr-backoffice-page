import { backendBaseUrl } from './config';
import { authStorage } from './authStorage';

interface ApiEnvelope<T> {
  data: T;
}

interface ProblemDetails {
  detail?: string;
  title?: string;
  message?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

const buildUrl = (path: string) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${backendBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
};

const parseResponse = async <T>(response: Response) => {
  if (response.status === 204) {
    return null as T;
  }
  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data ?? (payload as unknown as T);
};

const refreshSession = async () => {
  const refreshToken = authStorage.getRefreshToken();
  const email = authStorage.getEmail();
  if (!refreshToken || !email) {
    return false;
  }

  const response = await fetch(buildUrl('/auth/refresh-token'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    authStorage.clearSession();
    return false;
  }

  const payload = (await response.json()) as ApiEnvelope<{
    access_token: string;
    refresh_token: string;
  }>;

  if (!payload.data?.access_token || !payload.data?.refresh_token) {
    authStorage.clearSession();
    return false;
  }

  authStorage.setSession(payload.data.access_token, payload.data.refresh_token, email);
  return true;
};

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const accessToken = authStorage.getAccessToken();
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(options.skipAuth || !accessToken ? {} : { Authorization: `Bearer ${accessToken}` }),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options.skipAuth) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, options);
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || response.statusText;
    try {
      const parsed = JSON.parse(errorText) as ProblemDetails;
      message = parsed.detail ?? parsed.message ?? parsed.title ?? message;
    } catch {
      // Fall back to the raw payload or the HTTP status text.
    }
    throw new Error(message);
  }

  return parseResponse<T>(response);
};
