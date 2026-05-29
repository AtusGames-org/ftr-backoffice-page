# Feed the Realm — Backoffice

Admin dashboard for managing the Feed the Realm game platform. Built with React, TypeScript, and Vite.

## Technologies

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [React Router v7](https://reactrouter.com/)
- [MUI (Material UI)](https://mui.com/)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### Development

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Build

```bash
# Type-check and build for production
pnpm build

# Preview the production build locally
pnpm preview
```

### Lint

```bash
pnpm lint
```

## Structure

```
src/
├── pages/          # Top-level route views
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Users.tsx
│   ├── Worlds.tsx
│   ├── Metrics.tsx
│   └── Exports.tsx
├── components/     # Shared UI components (Sidebar, Topbar, Dialogs, etc.)
├── services/       # API client and per-domain service modules
└── assets/         # Static assets
```

## Configuration

The app connects to the core-service API. Set the base URL in `src/services/config.ts` or via environment variables before building.
