import { useParams } from "react-router-dom";
import { findMockCatById } from "../data/mockCats";

/**
 * Placeholder for the next milestone: will show full photos, description,
 * traits, shelter info, distance, and an external adoption link.
 */
export function CatDetailPage() {
  const { catId } = useParams<{ catId: string }>();
  const cat = catId ? findMockCatById(catId) : undefined;

  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold text-mauve-700">
        {cat ? cat.name : "Cat detail coming soon"}
      </h1>
      <p className="mt-3 text-mauve-500">
        {cat
          ? `Full details for ${cat.name} will live here.`
          : `No mock cat found for id "${catId}".`}
      </p>
    </div>
  );
}
