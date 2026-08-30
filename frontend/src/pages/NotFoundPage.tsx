import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold text-mauve-700">
        🐾 Page not found
      </h1>
      <p className="mt-3 text-mauve-500">We couldn't find that page.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Back to search
      </Link>
    </div>
  );
}
