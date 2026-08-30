# Backend (planned)

Not yet scaffolded — this is the next milestone.

## Planned stack

Node.js + Express + TypeScript.

## Planned structure

```
backend/
├─ src/
│  ├─ sources/
│  │  └─ rescuegroups/
│  │     ├─ client.ts      # RescueGroups API client (holds the API key, server-side only)
│  │     └─ mapper.ts      # Maps RescueGroups payloads -> the shared Cat model
│  ├─ models/
│  │  └─ cat.ts            # Shared normalized Cat model (mirrors frontend/src/types/cat.ts)
│  ├─ routes/
│  │  └─ cats.ts           # GET /api/cats (search), GET /api/cats/:id
│  └─ server.ts
└─ .env                    # RESCUEGROUPS_API_KEY etc. (never committed)
```

Each future data source (Petfinder, Adopt-a-Pet, individual shelter feeds,
etc.) gets its own folder under `src/sources/<source>/` with a client +
mapper, so adding a source never touches existing adapters or the frontend.
API keys stay server-side in environment variables and are never exposed to
the client.
