# Mew & You — API

Express + TypeScript backend that aggregates adoptable cats. Currently wraps
the RescueGroups.org v5 API; the frontend only ever talks to this server.

## Setup

```
npm install
cp .env.example .env   # then fill in RESCUEGROUPS_API_KEY
npm run dev
```

Get a free public API key at
[rescuegroups.org/services/adoptable-pet-data-api](https://rescuegroups.org/services/adoptable-pet-data-api/).
Without a key the server still starts (with a warning), but every
`/api/cats` request returns a clear `500 rescuegroups_error` until it's set.

## Endpoints

| Method | Path                            | Description                                                                |
| ------ | ------------------------------- | -------------------------------------------------------------------------- |
| GET    | `/api/cats?zip=91350&radius=25` | Available cats within `radius` miles of `zip`.                             |
| GET    | `/api/cats/:id`                 | A single cat's full profile, by normalized id (e.g. `rescuegroups:12345`). |
| GET    | `/health`                       | Liveness check.                                                            |

Errors are always `{ "error": { "code": string, "message": string } }` with
an appropriate status code (400 invalid input, 404 not found, 429 upstream
rate limit, 502 upstream/network failure, 500 server misconfiguration or
unexpected error).

## Structure

```
src/
├─ integrations/rescuegroups/
│  ├─ client.ts    RescueGroups HTTP client (holds the API key; never imported by routes directly for its types)
│  ├─ types.ts     RescueGroups-specific JSON:API shapes — isolated here, never used outside this folder
│  ├─ mapper.ts     Maps a RescueGroups animal (+ included orgs/pictures/locations) -> our normalized Cat
│  └─ mapper.test.ts
├─ models/cat.ts    Normalized Cat model (mirrors frontend/src/types/cat.ts)
├─ routes/cats.ts   GET /api/cats, GET /api/cats/:id
├─ lib/             validation (zip/radius), ApiError
├─ middleware/       error-handling middleware -> consistent JSON error shape
├─ config/env.ts     loads/validates environment variables
└─ server.ts
```

Adding a second source later (Petfinder, Adopt-a-Pet, etc.) means adding a
new `src/integrations/<source>/` folder with its own client + mapper, and
merging results in `routes/cats.ts` — existing adapters and the frontend
don't change.

## Testing

```
npm run test
```

Unit tests cover the RescueGroups mapper's handling of missing photos,
missing breed, unknown/missing sex, missing organization/location data, and
messy or blank descriptions — all common with real shelter data.
