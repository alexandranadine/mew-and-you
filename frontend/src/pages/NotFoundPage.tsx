import { Link, useLocation } from "react-router-dom";
import { PageMeta } from "../components/seo/PageMeta";
import { notFoundSeo } from "../config/seo";

export function NotFoundPage() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <PageMeta
        title={notFoundSeo.title}
        description={notFoundSeo.description}
        canonicalPath={location.pathname}
        robots={notFoundSeo.robots}
      />
      <h1 className="text-3xl font-semibold text-mauve-700">
        <span aria-hidden="true">🐾 </span>
        This page wandered off
      </h1>
      <p className="mt-3 text-mauve-500">
        We couldn't find what you were looking for. Let's get you back to the
        cats.
      </p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Back to search
      </Link>
    </div>
  );
}
