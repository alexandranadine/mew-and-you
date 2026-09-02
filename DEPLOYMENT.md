# Deployment guide (staging & production)

This document describes how to deploy **Mew & You** using the existing
architecture: a static React SPA (`frontend/`) and a separate Node.js Express API
(`api/`). No hosting provider is assumed — configure routing, env vars, and
build steps on whichever platform you choose.

## Architecture overview

```
Browser
   │
   ▼
┌─────────────────────────────────────────────┐
│  Reverse proxy / CDN (your hosting layer)   │
│                                             │
│  /, /cats, /about, …  →  frontend/dist/     │  SPA + static assets
│  /api/*               →  Express API        │  Node process (api/)
│  /health              →  Express API        │  Liveness (optional alias)
└─────────────────────────────────────────────┘
```

Locally, Vite's dev proxy (`frontend/vite.config.ts`) forwards `/api/*` to
`http://localhost:3001`. **Production should mirror that same-origin layout** so
the frontend can keep using relative paths like `fetch("/api/cats?…")` with no
code changes.

The API is intentionally cross-origin-capable (CORS is enforced), but the
frontend does **not** read a `VITE_API_URL` — it always calls `/api/...` on the
page's origin.

## Build commands

Use **Node.js 20** (matches [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

### API (`api/`)

```bash
cd api
npm ci
npm run build    # compiles TypeScript → dist/
npm run test     # optional but recommended before deploy
npm start        # runs node dist/server.js
```

| Script   | Purpose                          |
| -------- | -------------------------------- |
| `build`  | `tsc -p tsconfig.json`           |
| `start`  | `node dist/server.js`            |
| `test`   | `vitest run` (57 tests)          |

The API entry point is `dist/server.js` (`package.json` `"main"`).

### Frontend (`frontend/`)

```bash
cd frontend
npm ci
VITE_SITE_URL=https://staging.example.com npm run build   # see env vars below
npm run lint     # optional; run in CI
```

| Script   | Purpose                          |
| -------- | -------------------------------- |
| `build`  | `tsc -b && vite build`           |
| `lint`   | `oxlint`                         |

Build output is `frontend/dist/`. Serve that directory as static files. There is
no Node `start` script for the frontend — any static file host or CDN works.

## Environment variables

### API — runtime (set on the API service)

Copy [`api/.env.example`](api/.env.example) as a starting point.

| Variable | Required | Default | Notes |
| -------- | -------- | ------- | ----- |
| `NODE_ENV` | **Yes** (staging/prod) | `development` | Must be `production` for staging/production deploys. The server validates config strictly in production and exits on errors. |
| `CORS_ORIGIN` | **Yes** in production | `http://localhost:5173` (dev only) | Comma-separated browser origins allowed to call the API. See [CORS](#cors-origin-configuration). |
| `PORT` | No | `3001` | Listen port. Many platforms inject this automatically. |
| `DATA_PROVIDER` | No | `mock` | `mock` (local dataset, no key) or `rescuegroups` (live data). |
| `RESCUEGROUPS_API_KEY` | **Yes** when `DATA_PROVIDER=rescuegroups` | — | Server-side only. Never expose to the frontend. |
| `RESCUEGROUPS_BASE_URL` | No | `https://api.rescuegroups.org/v5` | Override only if RescueGroups provides a different endpoint. |
| `TRUST_PROXY` | No | `false` | Set to `true` **only** when the API sits behind a trusted reverse proxy or load balancer so rate limiting uses the real client IP (`X-Forwarded-For`). |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` (15 min) | Rate-limit window for `/api/cats*`. |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per IP per window on `/api/cats*`. |

**Staging example** (mock data, no RescueGroups key):

```env
NODE_ENV=production
PORT=3001
DATA_PROVIDER=mock
CORS_ORIGIN=https://staging.example.com
TRUST_PROXY=true
```

**Staging example** (live RescueGroups data):

```env
NODE_ENV=production
PORT=3001
DATA_PROVIDER=rescuegroups
RESCUEGROUPS_API_KEY=<your-key>
CORS_ORIGIN=https://staging.example.com
TRUST_PROXY=true
```

On startup, invalid config is logged and the process exits immediately (see
`api/src/config/env.ts`).

### Frontend — build-time only

Copy [`frontend/.env.example`](frontend/.env.example).

| Variable | Required | Default | Notes |
| -------- | -------- | ------- | ----- |
| `VITE_SITE_URL` | **Yes** for staging/prod | `http://localhost:5173` | Public origin of the SPA, **no trailing slash**. Baked into `robots.txt`, `sitemap.xml`, canonical `<link>`, and Open Graph image URLs at build time. Runtime page meta also uses it when set. |

**Staging example** (set before `npm run build`):

```env
VITE_SITE_URL=https://staging.example.com
```

If `VITE_SITE_URL` is omitted at build time, SEO artifacts default to
`http://localhost:5173`, which is wrong outside local dev.

## API base URL configuration

The frontend never configures an API host. All requests use same-origin relative
paths:

- `GET /api/cats?zip=…&radius=…` — search
- `GET /api/cats/:id` — detail
- `GET /api/health` — health (also available at `/health` on the API)

**Required production routing** (at your reverse proxy / edge):

| Request path | Destination |
| ------------ | ----------- |
| `/api/*` | Express API (`api` service) |
| `/health` | Express API (optional; some platforms probe `/health` at the root) |
| Everything else (see SPA fallback) | `frontend/dist/` static files |

Do **not** point the SPA at a separate API subdomain unless you also add a
`VITE_*` API base URL to the frontend (not part of the current architecture).

## CORS origin configuration

CORS is enforced in `api/src/app.ts` via the `cors` package. Allowed origins
come **only** from `CORS_ORIGIN` (comma-separated). Unlisted origins receive no
`Access-Control-Allow-Origin` header.

| Scenario | `CORS_ORIGIN` value |
| -------- | ------------------- |
| Same-origin deploy (recommended) | Set to the public SPA origin anyway — required in production for the API to start, even though browser requests from the SPA are same-origin and do not trigger CORS preflight for simple GETs. |
| Separate API subdomain (not supported by current frontend) | List every frontend origin that will call the API directly, e.g. `https://staging.example.com,https://www.staging.example.com` |
| Local dev | Defaults to `http://localhost:5173` if unset |

Rules:

- No trailing slashes on origins (`https://staging.example.com`, not `https://staging.example.com/`).
- Multiple origins: comma-separated, spaces optional (`https://a.example, https://www.a.example`).
- Only `GET` is allowed (matches current API surface).
- `CORS_ORIGIN` is **mandatory** when `NODE_ENV=production`; the API refuses to start without it.

## SPA route fallback

The app uses React Router `BrowserRouter` (`frontend/src/main.tsx`). Direct
navigation or refresh on any client route must return `index.html` so the SPA
can boot and route client-side.

### Routes that need `index.html` fallback

| Path | Page |
| ---- | ---- |
| `/` | Home |
| `/cats` | Search results (supports `?zip=&radius=` query params) |
| `/cats/:catId` | Cat detail |
| `/about` | About |
| Any other non-file path | In-app 404 (`NotFoundPage`) — still serve `index.html` |

### Paths that must **not** fall back to `index.html`

| Path | Serve from |
| ---- | ---------- |
| `/api/*` | API backend |
| `/assets/*` | Built JS/CSS bundles (`frontend/dist/assets/`) |
| `/images/*` | Static images |
| `/favicon.svg`, `/apple-touch-icon.svg`, `/site.webmanifest` | `frontend/dist/` |
| `/robots.txt`, `/sitemap.xml` | `frontend/dist/` (generated at build time with `VITE_SITE_URL`) |

### Generic fallback rule

At the edge or reverse proxy:

1. If the path starts with `/api/`, proxy to the API.
2. If the path matches a file that exists in `frontend/dist/`, serve it.
3. Otherwise, serve `frontend/dist/index.html` with `200` (not a redirect).

Exact syntax depends on the host (nginx `try_files`, Cloudflare `_redirects`,
Netlify `[[redirects]]`, etc.) — configure that when you choose a provider.

## Health checks

Point platform health probes at either:

- `GET /api/health` — preferred (works through the `/api` proxy)
- `GET /health` — root alias on the API process

Both return a JSON liveness response and are **not** rate-limited.

## Pre-deploy checklist

- [ ] `NODE_ENV=production` on the API service
- [ ] `CORS_ORIGIN` set to the staging/production SPA origin
- [ ] `TRUST_PROXY=true` if behind a load balancer / reverse proxy
- [ ] `DATA_PROVIDER` and `RESCUEGROUPS_API_KEY` set appropriately
- [ ] `VITE_SITE_URL` set **before** `frontend` build
- [ ] Reverse proxy routes `/api/*` to the API and serves `frontend/dist/` for all other paths with SPA fallback
- [ ] `npm run build` + `npm run test` (API) and `npm run build` (frontend) succeed
- [ ] Smoke test: home page loads, search returns cats, direct URL to `/cats/:id` works on refresh

## What remains after this prep

These steps are **not** done yet — complete them when you pick a host:

1. **Choose hosting** for the static frontend and the Node API (or a single
   platform that runs both with a reverse proxy).
2. **Configure DNS + TLS** for the staging domain.
3. **Set environment variables** in the host's dashboard or secrets store (API
   runtime vars + frontend build-time `VITE_SITE_URL`).
4. **Wire routing** — `/api/*` → API, SPA fallback for all other paths.
5. **Configure health checks** on `/api/health` or `/health`.
6. **Provision `RESCUEGROUPS_API_KEY`** if staging should use live data
   (`DATA_PROVIDER=rescuegroups`).
7. **CI/CD** — extend [`.github/workflows/ci.yml`](.github/workflows/ci.yml) or
   add a deploy workflow to build artifacts and push to your host.
8. **Secrets hygiene** — ensure `.env` files are never committed (already in
   `.gitignore`).
