import { useEffect, useMemo, useRef, useState } from 'react';
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

const pageSize = 6;

type UploadDrafts = Record<ExportApp, { version: string; os: ExportOs; file: File | null }>;
type PaginationState = Record<ExportApp, Record<ExportOs, number>>;

const createInitialDrafts = (): UploadDrafts => ({
    ftr_world_editor: { version: '', os: 'linux', file: null },
    ftr_game: { version: '', os: 'linux', file: null },
});

const createInitialPagination = (): PaginationState => ({
    ftr_world_editor: { linux: 1, windows: 1 },
    ftr_game: { linux: 1, windows: 1 },
});

function ExportsPanel() {
    const [versions, setVersions] = useState<ExportVersion[]>([]);
    const [selectedApp, setSelectedApp] = useState<ExportApp>('ftr_world_editor');
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [drafts, setDrafts] = useState<UploadDrafts>(createInitialDrafts);
    const [pagination, setPagination] = useState<PaginationState>(createInitialPagination);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRefs = useRef<Record<ExportApp, HTMLInputElement | null>>({
        ftr_world_editor: null,
        ftr_game: null,
    });

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

    useEffect(() => {
        setPagination((current) => {
            const next = { ...current };

            appOptions.forEach((app) => {
                next[app.value] = { ...next[app.value] };
                osOptions.forEach((os) => {
                    const totalItems = versions.filter((entry) => entry.app_name === app.value && entry.os === os.value).length;
                    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
                    next[app.value][os.value] = Math.min(next[app.value][os.value] ?? 1, totalPages);
                });
            });

            return next;
        });
    }, [versions]);

    const groupedVersions = useMemo(
        () =>
            appOptions.map((app) => ({
                ...app,
                byOs: osOptions.map((os) => ({
                    ...os,
                    items: versions
                        .filter((entry) => entry.app_name === app.value && entry.os === os.value)
                        .slice()
                        .sort((left, right) => {
                            const leftTime = new Date(left.created_at).getTime();
                            const rightTime = new Date(right.created_at).getTime();
                            return rightTime - leftTime;
                        }),
                })),
            })),
        [versions],
    );

    const activeApp = groupedVersions.find((entry) => entry.value === selectedApp) ?? groupedVersions[0];

    const setPageFor = (appName: ExportApp, os: ExportOs, page: number) => {
        setPagination((current) => ({
            ...current,
            [appName]: {
                ...current[appName],
                [os]: page,
            },
        }));
    };

    const handleFileDrop = (appName: ExportApp, file: File | null) => {
        if (!file || !file.name.toLowerCase().endsWith('.zip')) {
            setErrorMessage('Please drop a .zip file');
            return;
        }

        setErrorMessage(null);
        setDrafts((current) => ({
            ...current,
            [appName]: { ...current[appName], file },
        }));
    };

    const activeDraft = drafts[selectedApp];

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

    const handleChooseFileClick = (appName: ExportApp) => {
        fileInputRefs.current[appName]?.click();
    };

    const renderVersionPager = (appName: ExportApp, os: ExportOs, totalItems: number) => {
        const currentPage = pagination[appName][os];
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safePage = Math.min(currentPage, totalPages);

        if (safePage !== currentPage) {
            setPageFor(appName, os, safePage);
        }

        return (
            <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[rgba(184,176,214,0.8)]">
                <p>
                    Page {safePage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPageFor(appName, os, Math.max(1, safePage - 1))}
                        disabled={safePage <= 1}
                        className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.28)] px-3 py-1 font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => setPageFor(appName, os, Math.min(totalPages, safePage + 1))}
                        disabled={safePage >= totalPages}
                        className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.28)] px-3 py-1 font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5 text-xs text-[#c9c1ea]">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="app-title text-2xl text-[#f8f5ff]">Exports</p>
                    <p className="mt-1 text-sm text-[rgba(184,176,214,0.8)]">Promote, publish, and download build artifacts.</p>
                </div>
                <button
                    type="button"
                    className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.35)] px-4 py-2 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)]"
                    onClick={loadVersions}
                >
                    Refresh
                </button>
            </div>

            <div className="flex flex-wrap gap-2 rounded-full border border-[#2a2640] bg-[#0f0d17] p-2">
                {appOptions.map((app) => {
                    const isActive = selectedApp === app.value;
                    return (
                        <button
                            key={app.value}
                            type="button"
                            onClick={() => setSelectedApp(app.value)}
                            className={`cursor-pointer flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${isActive
                                ? 'bg-[rgba(245,180,74,0.18)] text-[#f8f5ff] shadow-[0_0_18px_rgba(245,180,74,0.12)]'
                                : 'text-[rgba(184,176,214,0.9)] hover:bg-[rgba(106,228,255,0.1)] hover:text-[#f8f5ff]'
                                }`}
                        >
                            {app.label}
                        </button>
                    );
                })}
            </div>

            {errorMessage && <p className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">{errorMessage}</p>}
            {statusMessage && (
                <p className="mt-3 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                    {statusMessage}
                </p>
            )}

            {activeApp && (
                <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
                    <section className="rounded-2xl border border-[#2a2640] bg-[rgba(12,10,20,0.72)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.28em] text-[#6ae4ff]">Upload</p>
                                <h3 className="mt-2 text-lg font-semibold text-[#f8f5ff]">{activeApp.label}</h3>
                            </div>
                        </div>

                        <div className="mt-5 space-y-4">
                            <div className="grid gap-2">
                                <label className="text-[11px] uppercase tracking-[0.2em] text-[#6ae4ff]">Version tag</label>
                                <input
                                    type="text"
                                    value={activeDraft.version}
                                    onChange={(event) =>
                                        setDrafts((current) => ({
                                            ...current,
                                            [selectedApp]: { ...current[selectedApp], version: event.target.value },
                                        }))
                                    }
                                    placeholder="v1.2.3"
                                    className="rounded-xl border border-[#2a2640] bg-[#0f0d17] px-4 py-3 text-sm text-[#f8f5ff] outline-none placeholder:text-[#6d6790] focus:border-[rgba(106,228,255,0.45)]"
                                />
                            </div>

                            <div className="grid gap-2">
                                <label className="text-[11px] uppercase tracking-[0.2em] text-[#6ae4ff]">Operating system</label>
                                <select
                                    value={activeDraft.os}
                                    onChange={(event) =>
                                        setDrafts((current) => ({
                                            ...current,
                                            [selectedApp]: { ...current[selectedApp], os: event.target.value as ExportOs },
                                        }))
                                    }
                                    className="cursor-pointer rounded-xl border border-[#2a2640] bg-[#0f0d17] px-4 py-3 text-sm text-[#f8f5ff] outline-none focus:border-[rgba(106,228,255,0.45)]"
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
                                    ref={(element) => {
                                        fileInputRefs.current[selectedApp] = element;
                                    }}
                                    type="file"
                                    accept=".zip"
                                    className="sr-only"
                                    onChange={(event) => {
                                        handleFileDrop(selectedApp, event.target.files?.[0] ?? null);
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleChooseFileClick(selectedApp)}
                                    onDragEnter={(event) => {
                                        event.preventDefault();
                                        setDragActive(true);
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        event.dataTransfer.dropEffect = 'copy';
                                        setDragActive(true);
                                    }}
                                    onDragLeave={(event) => {
                                        event.preventDefault();
                                        setDragActive(false);
                                    }}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        setDragActive(false);
                                        handleFileDrop(selectedApp, event.dataTransfer.files?.[0] ?? null);
                                    }}
                                    className={`cursor-pointer group flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center transition ${dragActive
                                        ? 'border-[rgba(245,180,74,0.7)] bg-[rgba(245,180,74,0.12)] shadow-[0_0_0_1px_rgba(245,180,74,0.24)]'
                                        : 'border-[rgba(106,228,255,0.28)] bg-[#0f0d17] hover:border-[rgba(106,228,255,0.5)] hover:bg-[rgba(106,228,255,0.06)]'
                                        }`}
                                >
                                    <p className="text-sm font-semibold text-[#f8f5ff]">Drag and drop your .zip here</p>
                                    <p className="mt-1 text-[11px] text-[rgba(184,176,214,0.8)]">or click to browse files</p>
                                    <p className="mt-3 rounded-full border border-[rgba(106,228,255,0.22)] px-3 py-1 text-[11px] font-semibold text-[#6ae4ff] transition group-hover:border-[rgba(106,228,255,0.4)]">
                                        {dragActive ? 'Drop to attach' : 'Drag-and-drop supported'}
                                    </p>
                                    <p className="mt-3 text-[11px] text-[rgba(184,176,214,0.8)]">
                                        {activeDraft.file ? `Selected: ${activeDraft.file.name}` : 'No file selected yet'}
                                    </p>
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={busyKey === `${selectedApp}:${activeDraft.os}:upload` || !activeDraft.version.trim() || !activeDraft.file}
                                onClick={() => handleUpload(selectedApp)}
                                className="cursor-pointer w-full rounded-xl bg-[linear-gradient(135deg,rgba(245,180,74,0.9),rgba(245,180,74,0.55))] px-4 py-3 text-sm font-semibold text-[#140f08] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Upload release
                            </button>
                        </div>
                    </section>

                    <section className="space-y-4">
                        {activeApp.byOs.map((osSection) => {
                            const osVersions = osSection.items;
                            const currentPage = pagination[selectedApp][osSection.value];
                            const totalPages = Math.max(1, Math.ceil(osVersions.length / pageSize));
                            const pageStart = (Math.min(currentPage, totalPages) - 1) * pageSize;
                            const pageItems = osVersions.slice(pageStart, pageStart + pageSize);

                            return (
                                <div key={`${selectedApp}-${osSection.value}`} className="rounded-2xl border border-[#2a2640] bg-[rgba(12,10,20,0.72)] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.28em] text-[#6ae4ff]">{osSection.label}</p>
                                            <h3 className="mt-2 text-lg font-semibold text-[#f8f5ff]">
                                                {osVersions.length} version{osVersions.length === 1 ? '' : 's'}
                                            </h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDownloadLatest(selectedApp, osSection.value)}
                                            disabled={busyKey === `${selectedApp}:${osSection.value}:latest`}
                                            className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.35)] px-4 py-2 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Download latest
                                        </button>
                                    </div>

                                    {loading ? (
                                        <p className="mt-4 text-[11px] text-[rgba(184,176,214,0.8)]">Loading versions...</p>
                                    ) : osVersions.length === 0 ? (
                                        <div className="mt-5 rounded-xl border border-dashed border-[#2a2640] bg-[#0f0d17] px-4 py-8 text-center text-[11px] text-[rgba(184,176,214,0.8)]">
                                            No versions yet for this platform.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mt-4 space-y-3">
                                                {pageItems.map((entry) => (
                                                    <div key={`${entry.app_name}-${entry.os}-${entry.version}`} className="rounded-xl border border-[#2a2640] bg-[#0f0d17] px-4 py-3 transition hover:border-[rgba(106,228,255,0.25)]">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-base font-semibold text-[#f8f5ff]">{entry.version}</p>
                                                                <p className="mt-1 text-[11px] text-[rgba(184,176,214,0.8)]">{new Date(entry.created_at).toLocaleString()}</p>
                                                                {entry.is_latest && <p className="mt-2 text-[11px] font-semibold text-emerald-300">Latest</p>}
                                                            </div>
                                                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDownload(entry.path)}
                                                                    className="cursor-pointer rounded-full border border-[rgba(245,180,74,0.35)] px-3 py-2 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(245,180,74,0.12)]"
                                                                >
                                                                    Download
                                                                </button>
                                                                {!entry.is_latest && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetLatest(entry)}
                                                                        disabled={busyKey === `${entry.app_name}:${entry.os}:${entry.version}:latest`}
                                                                        className="cursor-pointer rounded-full border border-[rgba(106,228,255,0.35)] px-3 py-2 text-[11px] font-semibold text-[#f8f5ff] transition hover:bg-[rgba(106,228,255,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
                                                                    >
                                                                        Set latest
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDelete(entry)}
                                                                    disabled={busyKey === `${entry.app_name}:${entry.os}:${entry.version}:delete`}
                                                                    className="cursor-pointer rounded-full border border-red-400/40 px-3 py-2 text-[11px] font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {renderVersionPager(selectedApp, osSection.value, osVersions.length)}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                </div>
            )}
        </div>
    );
}

export default ExportsPanel;
