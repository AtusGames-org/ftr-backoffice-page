import { apiRequest } from './apiClient';
import { exportsCdnBaseUrl } from './config';

export type ExportApp = 'ftr_world_editor' | 'ftr_game';
export type ExportOs = 'linux' | 'windows';

export interface ExportVersion {
  app_name: ExportApp;
  version: string;
  os: ExportOs;
  path: string;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExportUploadInput {
  appName: ExportApp;
  version: string;
  os: ExportOs;
  file: File;
}

export interface ExportSetLatestInput {
  appName: ExportApp;
  version: string;
  os: ExportOs;
}

const buildDownloadUrl = (path: string) => {
  const base = exportsCdnBaseUrl.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};

export const getExportVersions = async (filters: { appName?: ExportApp; os?: ExportOs } = {}): Promise<ExportVersion[]> => {
  const params = new URLSearchParams();
  if (filters.appName) {
    params.set('app', filters.appName);
  }
  if (filters.os) {
    params.set('os', filters.os);
  }

  const suffix = params.toString() ? `?${params}` : '';
  return apiRequest<ExportVersion[]>(`/exports/zip/versions${suffix}`);
};

export const getExportZipPath = async (filters: { appName: ExportApp; os: ExportOs; version?: string }): Promise<string> => {
  const params = new URLSearchParams();
  params.set('app', filters.appName);
  params.set('os', filters.os);
  if (filters.version) {
    params.set('version', filters.version);
  }

  const response = await apiRequest<{ path: string }>(`/exports/zip?${params}`);
  return buildDownloadUrl(response.path);
};

export const uploadExportZip = async (input: ExportUploadInput): Promise<ExportVersion> => {
  const formData = new FormData();
  formData.set('app', input.appName);
  formData.set('version', input.version);
  formData.set('os', input.os);
  formData.set('file', input.file);

  return apiRequest<ExportVersion>('/exports/zip', {
    method: 'PUT',
    body: formData,
  });
};

export const setExportVersionLatest = async (input: ExportSetLatestInput): Promise<ExportVersion> =>
  apiRequest<ExportVersion>('/exports/zip/latest', {
    method: 'PATCH',
    body: {
      app_name: input.appName,
      version: input.version,
      os: input.os,
    },
  });

export const deleteExportVersion = async (input: ExportSetLatestInput): Promise<void> =>
  apiRequest<void>(`/exports/zip?app=${input.appName}&version=${encodeURIComponent(input.version)}&os=${input.os}`, {
    method: 'DELETE',
  });

export const getExportDownloadUrl = (path: string) => buildDownloadUrl(path);
