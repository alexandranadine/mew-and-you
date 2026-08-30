# Mew & You

A web app for finding adoptable cats in Los Angeles County, aggregated from
shelter and rescue data sources.

> The name "Mew & You" is a placeholder brand — see
> [`frontend/src/config/brand.ts`](frontend/src/config/brand.ts) to re-skin it.

## Project structure

```
mew-and-you/
├─ frontend/   React + Vite + TypeScript + Tailwind CSS UI (this milestone)
└─ backend/    Node.js + Express + TypeScript API (upcoming milestone)
```

The frontend never talks to shelter/rescue APIs directly — it only calls our
own backend, which normalizes every source into one shared `Cat` model.

## Status

- [x] Frontend scaffold (Vite + React + TS + Tailwind, React Router, TanStack Query)
- [x] Shared `Cat` types, mock data, routing skeleton
- [x] Home / search page
- [ ] Results page wired to real search
- [ ] Cat detail page
- [ ] Backend (Express + TS) with RescueGroups adapter
- [ ] Additional source adapters

## Frontend

```
cd frontend
npm install
npm run dev
```

See [`frontend/README.md`](frontend/README.md) for details.

## Backend

Not yet scaffolded. See [`backend/README.md`](backend/README.md) for the plan.
