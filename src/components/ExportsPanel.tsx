import { useEffect, useMemo, useState } from 'react';
import {
    deleteExportVersion,
    getExportDownloadUrl,
    getExportVersions,
    getExportZipPath,
    setExportVersionLatest,
    type ExportApp,
    type ExportOs,
    type ExportVersion,
    uploadExportZip,
} from '../services/exportsService';

const appOptions: { label: string; value: ExportApp }[] = [
    { label: 'Feed the Realm - World Editor', value: 'ftr_world_editor' },
    { label: 'Feed the Realm - Game', value: 'ftr_game' },
];

const osOptions: { label: string; value: ExportOs }[] = [
    { label: 'Linux', value: 'linux' },
    { label: 'Windows', value: 'windows' },
];

type UploadDrafts = Record<ExportApp, { version: string; os: ExportOs; file: File | null }>;

const createInitialDrafts = (): UploadDrafts => ({
    ftr_world_editor: { version: '', os: 'linux', file: null },
    ftr_game: { version: '', os: 'linux', file: null },
});

function ExportsPanel() {
    const [versions, setVersions] = useState<ExportVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<UploadDrafts>(createInitialDrafts);

    const loadVersions = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await getExportVersions();
            setVersions(data);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load exports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVersions();
    }, []);

    const groupedVersions = useMemo(
        () =>
            appOptions.map((app) => ({
                ...app,
                byOs: osOptions.map((os) => ({
                    ...os,
                    items: versions.filter((entry) => entry.app_name === app.value && entry.os === os.value),
                })),
            })),
        [versions],
    );

    const handleDownload = (path: string) => {
        window.open(getExportDownloadUrl(path), '_blank', 'noopener,noreferrer');
    };

    const handleDownloadLatest = async (appName: ExportApp, os: ExportOs) => {
        const key = `${appName}:${os}:latest`;
        setBusyKey(key);
        setErrorMessage(null);
        try {
            const downloadUrl = await getExportZipPath({ appName, os });
            window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to get latest export path');
        } finally {
            setBusyKey(null);
        }
    };

    const handleUpload = async (appName: ExportApp) => {
        const draft = drafts[appName];
        if (!draft.version.trim() || !draft.file) {
            setErrorMessage('Version and zip file are required for uploads');
            return;
        }

        const key = `${appName}:${draft.os}:upload`;
        setBusyKey(key);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            await uploadExportZip({
                appName,
                version: draft.version.trim(),
                os: draft.os,
                file: draft.file,
            });
            setStatusMessage(`Uploaded ${appName} ${draft.version.trim()} (${draft.os})`);
            setDrafts((current) => ({
                ...current,
                [appName]: { version: '', os: current[appName].os, file: null },
            }));
            await loadVersions();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to upload export');
        } finally {
            setBusyKey(null);
        }
    };

    const handleSetLatest = async (entry: ExportVersion) => {
        const key = `${entry.app_name}:${entry.os}:${entry.version}:latest`;
        setBusyKey(key);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            await setExportVersionLatest({
                appName: entry.app_name,
                version: entry.version,
                os: entry.os,
            });
            setStatusMessage(`Set ${entry.app_name} ${entry.version} as latest`);
            await loadVersions();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to set latest export');
        } finally {
            setBusyKey(null);
        }
    };

    const handleDelete = async (entry: ExportVersion) => {
        if (!window.confirm(`Delete ${entry.app_name} ${entry.version} for ${entry.os}?`)) {
            return;
        }

        const key = `${entry.app_name}:${entry.os}:${entry.version}:delete`;
        setBusyKey(key);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            await deleteExportVersion({
                appName: entry.app_name,
                version: entry.version,
                os: entry.os,
            });
            setStatusMessage(`Deleted ${entry.app_name} ${entry.version}`);
            await loadVersions();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to delete export');
        } finally {
            setBusyKey(null);
        }
    };

    return (
        <section className="rounded-xl border border-[rgba(139,92,246,0.4)] bg-[rgba(12,10,20,0.7)] p-4 text-xs text-[#c9c1ea]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-semibold text-[#f8f5ff]">Exports</p>
                    <p className="mt-1 text-[rgba(184,176,214,0.8)]">Upload, promote, and download build artifacts.</p>
                </div>
                <button
                    type="button"
                    className="rounded-full border border-[rgba(106,228,255,0.35)] px-3 py-1 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)]"
                    onClick={loadVersions}
                >
                    Refresh
                </button>
            </div>

            {errorMessage && <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">{errorMessage}</p>}
            {statusMessage && (
                <p className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                    {statusMessage}
                </p>
            )}

            <div className="mt-4 space-y-4">
                {appOptions.map((app) => {
                    const draft = drafts[app.value];
                    const appVersions = groupedVersions.find((entry) => entry.value === app.value);
                    return (
                        <div key={app.value} className="rounded-lg border border-[#2a2640] bg-black/20 p-3">
                            <p className="font-semibold text-[#f8f5ff]">{app.label}</p>
                            <div className="mt-3 space-y-3">
                                <div className="grid gap-2">
                                    <label className="text-[11px] uppercase tracking-[0.2em] text-[#6ae4ff]">Version tag</label>
                                    <input
                                        type="text"
                                        value={draft.version}
                                        onChange={(event) =>
                                            setDrafts((current) => ({
                                                ...current,
                                                [app.value]: { ...current[app.value], version: event.target.value },
                                            }))
                                        }
                                        placeholder="v1.2.3"
                                        className="rounded-md border border-[#2a2640] bg-[#0f0d17] px-3 py-2 text-sm text-[#f8f5ff] outline-none placeholder:text-[#6d6790]"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[11px] uppercase tracking-[0.2em] text-[#6ae4ff]">Operating system</label>
                                    <select
                                        value={draft.os}
                                        onChange={(event) =>
                                            setDrafts((current) => ({
                                                ...current,
                                                [app.value]: { ...current[app.value], os: event.target.value as ExportOs },
                                            }))
                                        }
                                        className="cursor-pointer rounded-md border border-[#2a2640] bg-[#0f0d17] px-3 py-2 text-sm text-[#f8f5ff] outline-none"
                                    >
                                        {osOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[11px] uppercase tracking-[0.2em] text-[#6ae4ff]">Zip file</label>
                                    <input
                                        type="file"
                                        accept=".zip"
                                        onChange={(event) =>
                                            setDrafts((current) => ({
                                                ...current,
                                                [app.value]: {
                                                    ...current[app.value],
                                                    file: event.target.files?.[0] ?? null,
                                                },
                                            }))
                                        }
                                        className="cursor-pointer block w-full cursor-pointer rounded-md border border-[#2a2640] bg-[#0f0d17] px-3 py-2 text-xs text-[#c9c1ea] file:mr-3 file:rounded-full file:border-0 file:bg-[rgba(106,228,255,0.12)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[#f8f5ff]"
                                    />
                                </div>
                                <button
                                    type="button"
                                    disabled={busyKey === `${app.value}:${draft.os}:upload` || !draft.version.trim() || !draft.file}
                                    onClick={() => handleUpload(app.value)}
                                    className="cursor-pointer w-full rounded-md bg-[rgba(245,180,74,0.18)] px-3 py-2 text-sm font-semibold text-[#f8f5ff] transition hover:bg-[rgba(245,180,74,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Upload
                                </button>
                            </div>

                            {appVersions && appVersions.byOs.map((osSection) => (
                                <div key={`${app.value}-${osSection.value}`} className="mt-4 rounded-md border border-[#2a2640] bg-[#0b0a12] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#6ae4ff]">{osSection.label}</p>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadLatest(app.value, osSection.value)}
                                            disabled={busyKey === `${app.value}:${osSection.value}:latest`}
                                            className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.35)] px-2.5 py-1 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Download latest
                                        </button>
                                    </div>

                                    {loading ? (
                                        <p className="mt-3 text-[11px] text-[rgba(184,176,214,0.8)]">Loading versions...</p>
                                    ) : osSection.items.length === 0 ? (
                                        <p className="mt-3 text-[11px] text-[rgba(184,176,214,0.8)]">No versions yet.</p>
                                    ) : (
                                        <div className="mt-3 space-y-2">
                                            {osSection.items.map((entry) => (
                                                <div key={`${entry.app_name}-${entry.os}-${entry.version}`} className="rounded-md border border-[#2a2640] px-3 py-2">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-[#f8f5ff]">{entry.version}</p>
                                                            <p className="text-[11px] text-[rgba(184,176,214,0.8)]">{entry.os}</p>
                                                            {entry.is_latest && <p className="mt-1 text-[11px] text-emerald-300">Latest</p>}
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDownload(entry.path)}
                                                                className="cursor-pointer rounded-full border border-[rgba(245,180,74,0.35)] px-2.5 py-1 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(245,180,74,0.12)]"
                                                            >
                                                                Download
                                                            </button>
                                                            {!entry.is_latest && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetLatest(entry)}
                                                                    disabled={busyKey === `${entry.app_name}:${entry.os}:${entry.version}:latest`}
                                                                    className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.35)] px-2.5 py-1 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Set latest
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(entry)}
                                                                disabled={busyKey === `${entry.app_name}:${entry.os}:${entry.version}:delete`}
                                                                className="cursor-pointer rounded-full border border-red-400/40 px-2.5 py-1 text-[11px] font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default ExportsPanel;
