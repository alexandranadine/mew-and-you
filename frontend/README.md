# Mew & You — frontend

React + TypeScript + Vite app, styled with Tailwind CSS, using React Router
and TanStack Query. Searches and cat detail pages are fetched from our
backend (`../api`) — see below for running both together. A small set of
mock cats ([`src/data/mockCats.ts`](src/data/mockCats.ts)) still powers the
homepage teaser and is available as an optional dev fallback
(`src/api/mockCatsApi.ts`), but it's never used as a silent fallback if the
real API fails.

```
npm install
npm run dev
```

The dev server proxies `/api/*` to `http://localhost:3001` (see
`vite.config.ts`), so make sure the backend (`../api`) is running too —
otherwise search requests will fail with a connection error, which is
expected and will be shown in the results page's error state.

## Structure

```
src/
├─ api/
│  ├─ catsApi.ts        fetches /api/cats and /api/cats/:id from our backend
│  └─ mockCatsApi.ts     optional mock-data fallback (dev only, not wired in by default)
├─ components/
│  ├─ cats/              CatCard, CatFilterBar, trait badges, empty/error states
│  ├─ decorative/        small illustrative flourishes (paw prints, etc.)
│  ├─ layout/             header/footer/page shell
│  └─ search/             the ZIP/radius search form
├─ config/brand.ts        brand name/tagline — edit here to re-skin the app
├─ data/                  mockCats.ts + zipCoordinates.ts (mock-only)
├─ hooks/                 useCatsSearch / useCatDetail (TanStack Query)
├─ lib/                   distance/filter/sort utilities, URL search-param parsing
├─ pages/                 one component per route
└─ types/                 shared, source-agnostic Cat/search models
```

The app only ever talks to our own backend API — it never depends on
RescueGroups- or any other source's data shapes directly.

---

Scaffolded with `create-vite` (React + TypeScript template).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
