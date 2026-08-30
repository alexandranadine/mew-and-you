import { useSearchParams } from "react-router-dom";

/**
 * Placeholder for the next milestone: will fetch cats from the backend
 * (currently mock data) using the `location`/`radius` query params and
 * render a grid of `CatCard`s.
 */
export function ResultsPage() {
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location");
  const radius = searchParams.get("radius");

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold text-mauve-700">
        Results coming soon
      </h1>
      <p className="mt-3 text-mauve-500">
        {location
          ? `We'll show cats within ${radius ?? "?"} miles of "${location}" here.`
          : "Search from the home page to see results here."}
      </p>
    </div>
  );
}
