# Mew & You — API

Express + TypeScript backend that aggregates adoptable cats behind a small
provider abstraction. The frontend only ever talks to this server, never to
RescueGroups (or any future source) directly.

## Setup

```
npm install
cp .env.example .env
npm run dev
```

By default `DATA_PROVIDER=mock`, so the server runs immediately with **no
API key required** — `/api/cats` is served from a local mock dataset. To use
real RescueGroups data instead, set `DATA_PROVIDER=rescuegroups` and
`RESCUEGROUPS_API_KEY` in `.env` (get a free key at
[rescuegroups.org/services/adoptable-pet-data-api](https://rescuegroups.org/services/adoptable-pet-data-api/)).
Without a key in that mode, every `/api/cats` request returns a clear `500`.

## Endpoints

| Method | Path                            | Description                                                         |
| ------ | ------------------------------- | ------------------------------------------------------------------- |
| GET    | `/api/cats?zip=91350&radius=25` | Available cats within `radius` miles of `zip`. Rate-limited.        |
| GET    | `/api/cats/:id`                 | A single cat's full profile, by normalized id. Rate-limited.        |
| GET    | `/api/health`                   | Liveness check for deployment health checks. Not rate-limited.      |
| GET    | `/health`                       | Same as above, kept at the root for platforms that expect it there. |

Errors are always `{ "error": { "code": string, "message": string } }` with
an appropriate status code (400 invalid input, 404 not found, 429 rate
limited, 502 upstream/network failure, 500 server misconfiguration or
unexpected error). Client responses never include stack traces, provider
internals, or raw upstream error bodies — those go to server-side logs only.

## Provider architecture

`routes/cats.ts` never talks to a data source directly — it asks
`providers/index.ts` (`getCatProvider()`) for whichever `CatProvider` is
active, based on `DATA_PROVIDER`:

- **`mock`** (default) — `MockCatProvider` serves `src/data/mockCats.ts`,
  computing distance with a haversine formula against a small ZIP → lat/lng
  table (`src/data/zipCoordinates.ts`), the same way a real radius search
  would. No network calls, no API key.
- **`rescuegroups`** — `RescueGroupsProvider` wraps
  `integrations/rescuegroups/{client,mapper}.ts`.

Both implement the same `CatProvider` interface
(`searchCats`/`getCatById` → normalized `Cat`/`CatWithDistance`), so adding a
third source later means writing one more provider class — routes and the
frontend don't change.

## Structure

```
src/
├─ app.ts                        creates the Express app (helmet, CORS, rate limiting, logging, routes) — no listener, so tests can import it directly
├─ server.ts                     calls createApp() and starts listening
├─ providers/
│  ├─ CatProvider.ts             the interface every source implements
│  ├─ MockCatProvider.ts          serves src/data/mockCats.ts, no API key needed
│  ├─ RescueGroupsProvider.ts     wraps the RescueGroups integration below
│  └─ index.ts                    getCatProvider() factory, keyed off DATA_PROVIDER
├─ integrations/rescuegroups/
│  ├─ client.ts    RescueGroups HTTP client (holds the API key)
│  ├─ types.ts     RescueGroups-specific JSON:API shapes — isolated here, never used outside this folder
│  ├─ mapper.ts     Maps a RescueGroups animal (+ included orgs/pictures/locations) -> our normalized Cat
│  └─ mapper.test.ts
├─ data/            mockCats.ts + zipCoordinates.ts (mock provider only)
├─ models/cat.ts    Normalized Cat model (mirrors frontend/src/types/cat.ts)
├─ routes/          cats.ts (GET /api/cats, GET /api/cats/:id — provider-agnostic), health.ts
├─ lib/             validation (zip/radius), distance (haversine), errors (ApiError), logger (structured JSON logs)
├─ middleware/       errorHandler, rateLimiter, requestLogger
└─ config/env.ts     loads/validates environment variables, fails fast on bad config
```

## Production hardening

- **Fail-fast config validation** — `config/env.ts` (`parseEnv`, unit tested)
  validates all environment variables at startup. Invalid/missing required
  config (e.g. `DATA_PROVIDER=rescuegroups` with no API key, or a missing
  `CORS_ORIGIN` in production) logs a clear list of problems and exits
  immediately rather than starting in a broken state.
- **Security headers** — [Helmet](https://helmetjs.github.io/) is applied to
  every response, with `Cross-Origin-Resource-Policy` explicitly set to
  `cross-origin` (this API is intentionally called from a different origin;
  access control is CORS's job, not CORP's).
- **CORS** — origins come only from `CORS_ORIGIN` (comma-separated); nothing
  is reflected for unlisted origins. Required in production, defaults to
  `http://localhost:5173` in development.
- **Rate limiting** — `/api/cats*` is rate-limited per IP
  (`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`, defaults 100 req / 15 min).
  `/api/health` and `/health` are mounted outside the limiter so health
  checks are never throttled. Set `TRUST_PROXY=true` only when actually
  deployed behind a trusted reverse proxy/load balancer — otherwise a client
  could spoof `X-Forwarded-For` to dodge the limit.
- **Request size limits** — JSON bodies are capped at `10kb`.
- **Structured logging** — every request (`method`/`path`/`query`/`status`/
  `durationMs`) and every error is logged as a JSON line via `lib/logger.ts`.
  Headers are never logged, so secrets/cookies/tokens can't leak into logs.
- **Safe error responses** — `middleware/errorHandler.ts` only ever returns
  `{ code, message }` to clients. Upstream RescueGroups error bodies, stack
  traces, and internal details are logged server-side only, never sent to
  the client, in any environment.
- **Validation can't be bypassed** — `zip`/`radius` reject non-string
  (array/object) query values outright, guarding against parameter-pollution
  style bypass attempts (e.g. `?zip=90001&zip=90002`).

## Testing

```
npm run test
```

Unit tests cover both providers (mock radius/distance/unknown-ZIP behavior;
RescueGroupsProvider's mapping and error handling with the client mocked —
no live API calls or key needed) and the RescueGroups mapper's handling of
missing breed, unknown/missing sex, missing organization/location data, and
messy or blank descriptions — all common with real shelter data. Also
covered: environment validation (`config/env.test.ts`), zip/radius
validation edge cases and bypass attempts (`lib/validation.test.ts`), the
error handler's guarantee that nothing sensitive leaks to clients
(`middleware/errorHandler.test.ts`), and an integration suite against the
real Express app — health endpoints, 404s, CORS, security headers, and rate
limiting (`app.test.ts`, via `supertest`).
