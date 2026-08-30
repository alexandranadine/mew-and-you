# Mew & You

A web app for finding adoptable cats in Los Angeles County, aggregated from
shelter and rescue data sources.

> The name "Mew & You" is a placeholder brand — see
> [`frontend/src/config/brand.ts`](frontend/src/config/brand.ts) to re-skin it.

## Project structure

```
mew-and-you/
├─ frontend/   React + Vite + TypeScript + Tailwind CSS UI
└─ api/        Node.js + Express + TypeScript backend (wraps RescueGroups.org)
```

The frontend never talks to shelter/rescue APIs directly — it only calls our
own backend, which normalizes every source into one shared `Cat` model.

## Status

- [x] Frontend scaffold (Vite + React + TS + Tailwind, React Router, TanStack Query)
- [x] Shared `Cat` types, mock data, routing skeleton
- [x] Home / search page
- [x] Results page (filters, sort, distance) + cat detail page
- [x] Backend (Express + TS) with a RescueGroups adapter
- [ ] Additional source adapters
- [ ] Favorites, auth, persistence

## Running locally

Two servers, two terminals:

```
cd api
npm install
cp .env.example .env   # add your RESCUEGROUPS_API_KEY
npm run dev             # http://localhost:3001
```

```
cd frontend
npm install
npm run dev             # http://localhost:5173, proxies /api/* to the backend above
```

See [`api/README.md`](api/README.md) and [`frontend/README.md`](frontend/README.md) for details.
