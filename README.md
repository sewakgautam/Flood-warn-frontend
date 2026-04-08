# FloodWatch Dashboard

React + Vite frontend for the FloodWatch flood early warning system.

## Stack

| Concern | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| Charts | Recharts |
| Map | React Leaflet + Leaflet |
| Icons | Lucide React |

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx               # Entry point
│   ├── App.jsx                # Router + auth guard
│   ├── index.css              # Global styles
│   │
│   ├── lib/
│   │   └── api.js             # API client (fetch wrapper)
│   │
│   ├── hooks/
│   │   └── useAuth.jsx        # Auth context + token storage
│   │
│   ├── components/
│   │   └── Layout.jsx         # Sidebar + nav shell
│   │
│   └── pages/
│       ├── LoginPage.jsx      # Login form
│       ├── DashboardPage.jsx  # Overview: risk summary + recent alerts
│       ├── StationsPage.jsx   # Station list
│       ├── StationDetailPage.jsx  # Readings charts + prediction for one station
│       ├── AlertsPage.jsx     # Filterable alerts table
│       ├── SubmitReadingPage.jsx  # Manual sensor reading submission
│       ├── AdminPage.jsx      # Data management + sync status (admin/operator)
│       └── PublicMapPage.jsx  # Unauthenticated map view (/map)
├── index.html
├── vite.config.js
└── Dockerfile
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API URL

The frontend reads `VITE_API_URL` for the backend base URL. Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:8000/v1
```

If not set, it defaults to `/v1` (assumes the API is served from the same origin — useful when running behind a reverse proxy).

### 3. Start development server

```bash
npm run dev        # Vite dev server on http://localhost:3000
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve production build locally |

## Pages

| Route | Auth | Description |
|---|---|---|
| `/map` | Public | Live risk map — all active stations, colour-coded by risk level |
| `/login` | Public | Login form |
| `/` | Required | Dashboard — risk summary cards + latest alerts |
| `/stations` | Required | Station list with status badges |
| `/stations/:id` | Required | Station detail: rainfall + river level charts, flood prediction |
| `/alerts` | Required | Alerts table with filters (station, severity, date range) |
| `/submit` | Required | Submit a manual rainfall or river level reading |
| `/admin` | Required (admin/operator) | Edit / delete readings, station sync status |

## API Client

`src/lib/api.js` exports three objects:

```js
import { api, publicApi, adminApi } from './lib/api';

// Authenticated requests
await api.login(email, password);
await api.getStations();
await api.predict(stationId, windowHours);

// Public (no auth)
await publicApi.getMapData();

// Admin
await adminApi.getSyncStatus();
await adminApi.deleteRainfall(id);
```

The JWT is persisted in `localStorage` under the key `fw_token` and attached automatically to every authenticated request.

## Authentication

`useAuth` (from `src/hooks/useAuth.jsx`) provides:

```js
const { user, loading, login, logout } = useAuth();
```

- `user` — decoded JWT payload (`{ id, email, role }`) or `null`
- `login(email, password)` — calls the API, stores token, updates state
- `logout()` — clears token + state

Protected routes are wrapped in a `<PrivateRoute>` component that redirects to `/login` when unauthenticated.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `/v1` | Backend API base URL (include `/v1`) |
