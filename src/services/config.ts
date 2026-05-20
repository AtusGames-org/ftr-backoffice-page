export const backendBaseUrl =
    import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export const cosmeticsCdnBaseUrl =
    import.meta.env.VITE_COSMETICS_CDN ?? 'http://localhost:8081/cosmetics';

export const exportsCdnBaseUrl =
    import.meta.env.VITE_EXPORTS_CDN ?? 'http://localhost:8081/worlds';
