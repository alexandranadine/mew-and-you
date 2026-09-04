# Deployment guide (staging & production)

This document describes how to deploy **Mew & You** using the existing
architecture: a static React SPA (`frontend/`) and a separate Node.js Express API
(`api/`).

**Current production hosts**

| Layer | Platform | Notes |
| ----- | -------- | ----- |
| Frontend | Cloudflare Pages (`mew-and-you`) | Public origin: `https://mew-and-you.pages.dev` |
| API | Render (Node web service) | Blueprint: [`render.yaml`](render.yaml) (`mew-and-you-api-staging`) |

Same-origin `/api/*` is preserved in production by a Cloudflare Pages Function
(`frontend/functions/api/[[path]].ts`) that proxies to the Render origin. Do
**not** hardcode the Render hostname in application code — set it via env vars
(see below).

## Architecture overview

```
Browser
   │
   ▼
┌─────────────────────────────────────────────┐
│  Cloudflare Pages (frontend)                │
│                                             │
│  /, /cats, /about, …  →  frontend/dist/     │  SPA + static assets
│  /api/*               →  Pages Function     │  proxies via API_ORIGIN
│         └──────────────→  Render Express API│  Node process (api/)
│  /health (on API host)→  Express API        │  Liveness (Render probe)
└─────────────────────────────────────────────┘
```

Locally, Vite's dev proxy (`frontend/vite.config.ts`) forwards `/api/*` to
`http://localhost:3001`. **Production mirrors that same-origin layout** so the
frontend keeps using relative paths like `fetch("/api/cats?…")` with no code
changes.

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
VITE_SITE_URL=https://mew-and-you.pages.dev npm run build   # see env vars below
npm run lint     # optional; run in CI
```

| Script   | Purpose                          |
| -------- | -------------------------------- |
| `build`  | `tsc -b && vite build`           |
| `lint`   | `oxlint`                         |

Build output is `frontend/dist/`. Cloudflare Pages serves that directory (see
`frontend/wrangler.toml`). Cache headers ship from
[`frontend/public/_headers`](frontend/public/_headers); SPA fallback and API
Function routing use `_redirects` and `_routes.json`.

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

**Production / staging on Render** (mock data, no RescueGroups key):

```env
NODE_ENV=production
PORT=3001
DATA_PROVIDER=mock
CORS_ORIGIN=https://mew-and-you.pages.dev
TRUST_PROXY=true
```

**Production / staging on Render** (live RescueGroups data):

```env
NODE_ENV=production
PORT=3001
DATA_PROVIDER=rescuegroups
RESCUEGROUPS_API_KEY=<your-key>
CORS_ORIGIN=https://mew-and-you.pages.dev
TRUST_PROXY=true
```

Set `CORS_ORIGIN` in the Render dashboard (or Blueprint sync).
[`render.yaml`](render.yaml) declares the key with `sync: false` so the value
is not committed — use `https://mew-and-you.pages.dev` (no trailing slash).
If you also serve a custom domain or a Preview Pages URL, add those origins
comma-separated.

On startup, invalid config is logged and the process exits immediately (see
`api/src/config/env.ts`).

### Frontend — build-time (`VITE_*`) and Cloudflare runtime

Copy [`frontend/.env.example`](frontend/.env.example).

| Variable | Where | Required | Default | Notes |
| -------- | ----- | -------- | ------- | ----- |
| `VITE_SITE_URL` | Cloudflare Pages **build** env (Production / Preview) | **Yes** for staging/prod | `http://localhost:5173` | Public SPA origin, **no trailing slash**. Baked into `robots.txt`, `sitemap.xml`, canonical `<link>`, and Open Graph image URLs at build time. |
| `API_ORIGIN` | Cloudflare Pages **runtime** env (Production / Preview) | **Yes** when using the Pages Function proxy | — | Render API origin, **no trailing slash** (e.g. `https://YOUR-SERVICE.onrender.com`). Read only by `frontend/functions/api/[[path]].ts`. Never commit the real hostname into source. |

**Production build example**:

```env
VITE_SITE_URL=https://mew-and-you.pages.dev
```

**Cloudflare Pages dashboard (runtime)**:

```env
API_ORIGIN=https://YOUR-SERVICE.onrender.com
```

If `VITE_SITE_URL` is omitted at build time, SEO artifacts default to
`http://localhost:5173`, which is wrong outside local dev. If `API_ORIGIN` is
unset, `/api/*` returns **503** (`api_proxy_not_configured`) until configured.

## API base URL configuration

The frontend never configures an API host. All requests use same-origin relative
paths:

- `GET /api/cats?zip=…&radius=…` — search
- `GET /api/cats/:id` — detail
- `GET /api/health` — health (also available at `/health` on the API host)

**Required production routing** (Cloudflare Pages + Render):

| Request path | Destination |
| ------------ | ----------- |
| `/api/*` | Pages Function → `API_ORIGIN` (Render Express API) |
| `/health` | Render health check on the API service (`healthCheckPath` in `render.yaml`) |
| Everything else (see SPA fallback) | `frontend/dist/` static files |

Do **not** point the SPA at a separate API subdomain unless you also add a
`VITE_*` API base URL to the frontend (not part of the current architecture).

## CORS origin configuration

CORS is enforced in `api/src/app.ts` via the `cors` package. Allowed origins
come **only** from `CORS_ORIGIN` (comma-separated). Unlisted origins receive no
`Access-Control-Allow-Origin` header.

| Scenario | `CORS_ORIGIN` value |
| -------- | ------------------- |
| Production (Cloudflare Pages) | `https://mew-and-you.pages.dev` — set on the Render API service |
| Same-origin via Pages Function | Still set to the public SPA origin — required in production for the API to start (and needed if anything calls the Render URL directly) |
| Preview / extra fronts | Comma-separated list of every Pages origin that may call the API |
| Local dev | Defaults to `http://localhost:5173` if unset |

Rules:

- No trailing slashes on origins (`https://mew-and-you.pages.dev`, not `https://mew-and-you.pages.dev/`).
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

On Cloudflare Pages this is already wired:

1. `/api/*` → Pages Function (`_routes.json` + `functions/api/[[path]].ts`) using
   `API_ORIGIN`.
2. Existing files under `frontend/dist/` (including `_headers`) are served as-is.
3. All other paths → `index.html` via [`frontend/public/_redirects`](frontend/public/_redirects).

## Health checks

Point platform health probes at either:

- `GET /api/health` — preferred through the Pages `/api` proxy (needs `API_ORIGIN`)
- `GET /health` — root alias on the Render API process (`healthCheckPath` in `render.yaml`)

Both return a JSON liveness response and are **not** rate-limited.

## Pre-deploy checklist

- [ ] `NODE_ENV=production` on the Render API service
- [ ] Render `CORS_ORIGIN=https://mew-and-you.pages.dev` (plus any Preview origins)
- [ ] `TRUST_PROXY=true` on Render (already in `render.yaml`)
- [ ] `DATA_PROVIDER` and `RESCUEGROUPS_API_KEY` set appropriately
- [ ] Cloudflare Pages build env: `VITE_SITE_URL=https://mew-and-you.pages.dev`
- [ ] Cloudflare Pages runtime env: `API_ORIGIN=https://YOUR-SERVICE.onrender.com`
- [ ] `frontend/public/_headers` present in the deploy artifact (tracked in git)
- [ ] `npm run build` + `npm run test` (API) and `npm run build` / `npm run lint` (frontend) succeed
- [ ] Smoke test: home page loads, `/api/health` via Pages, search returns cats, direct URL to `/cats/:id` works on refresh

## What remains after this prep

Hosting is chosen (Cloudflare Pages + Render). Still operator-owned:

1. **Confirm dashboard env vars** — Pages `VITE_SITE_URL` + `API_ORIGIN`; Render
   `CORS_ORIGIN` (and RescueGroups key if live).
2. **Optional custom domain + DNS/TLS** on Pages (update `VITE_SITE_URL` and
   `CORS_ORIGIN` to match).
3. **Provision `RESCUEGROUPS_API_KEY`** if production should use live data
   (`DATA_PROVIDER=rescuegroups`).
4. **CI/CD** — extend [`.github/workflows/ci.yml`](.github/workflows/ci.yml) or
   add a deploy workflow if you want automated pushes.
5. **Secrets hygiene** — ensure `.env` files and real `API_ORIGIN` / API keys are
   never committed (already in `.gitignore`).
