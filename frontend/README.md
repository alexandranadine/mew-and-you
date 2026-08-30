# Mew & You — frontend

React + TypeScript + Vite app, styled with Tailwind CSS, using React Router
and TanStack Query. Currently runs entirely on mock data
([`src/data/mockCats.ts`](src/data/mockCats.ts)) so the UI works
independently of the backend/API.

```
npm install
npm run dev
```

## Structure

```
src/
├─ components/
│  ├─ cats/        CatCard and other cat-related presentational components
│  ├─ decorative/  small illustrative flourishes (paw prints, etc.)
│  ├─ layout/       header/footer/page shell
│  └─ search/       the ZIP/radius search form
├─ config/brand.ts  brand name/tagline — edit here to re-skin the app
├─ data/mockCats.ts mock Cat records used until the backend is wired up
├─ lib/             query client, shared constants
├─ pages/           one component per route
└─ types/cat.ts     shared, source-agnostic Cat model
```

The app only ever talks to our own backend API (once built) — it never
depends on RescueGroups- or any other source's data shapes directly.

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
