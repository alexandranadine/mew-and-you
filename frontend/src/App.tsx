import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { HomePage } from "./pages/HomePage";

// Lazily loaded so the initial bundle for the landing page (the most common
// entry point) doesn't include code only needed once a user searches.
const ResultsPage = lazy(() =>
  import("./pages/ResultsPage").then((m) => ({ default: m.ResultsPage })),
);
const CatDetailPage = lazy(() =>
  import("./pages/CatDetailPage").then((m) => ({ default: m.CatDetailPage })),
);
const AboutPage = lazy(() =>
  import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
const FavoritesPage = lazy(() =>
  import("./pages/FavoritesPage").then((m) => ({ default: m.FavoritesPage })),
);
const SavedSearchesPage = lazy(() =>
  import("./pages/SavedSearchesPage").then((m) => ({
    default: m.SavedSearchesPage,
  })),
);
const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

function RouteFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-3xl px-6 py-16 text-center text-mauve-400"
    >
      Loading…
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route
          path="cats"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ResultsPage />
            </Suspense>
          }
        />
        <Route
          path="cats/:catId"
          element={
            <Suspense fallback={<RouteFallback />}>
              <CatDetailPage />
            </Suspense>
          }
        />
        <Route
          path="about"
          element={
            <Suspense fallback={<RouteFallback />}>
              <AboutPage />
            </Suspense>
          }
        />
        <Route
          path="favorites"
          element={
            <Suspense fallback={<RouteFallback />}>
              <FavoritesPage />
            </Suspense>
          }
        />
        <Route
          path="saved-searches"
          element={
            <Suspense fallback={<RouteFallback />}>
              <SavedSearchesPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
