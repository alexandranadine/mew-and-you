import { Link } from "react-router-dom";
import { PageMeta } from "../components/seo/PageMeta";
import { aboutSeo } from "../config/seo";
import { brand } from "../config/brand";

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <PageMeta
        title={aboutSeo.title}
        description={aboutSeo.description}
        canonicalPath={aboutSeo.canonicalPath}
      />

      <h1 className="text-3xl font-semibold text-mauve-700">
        About {brand.name}
      </h1>
      <p className="mt-4 leading-relaxed text-mauve-600">
        {brand.name} is a cozy little search for adoptable cats in{" "}
        {brand.serviceArea}. We gather listings from local shelters and rescues
        so you can browse in one place — then we send you to the organization
        when you're ready to meet your future tiny landlord.
      </p>
      <p className="mt-4 leading-relaxed text-mauve-600">
        We're an aggregator, not a shelter. Cats move quickly, and the people
        who know a listing best are the ones who posted it. Always confirm
        availability directly with the rescue or shelter before you visit.
      </p>
      <p className="mt-4 leading-relaxed text-mauve-600">
        Right now we focus on {brand.serviceArea}. Search by ZIP code from the
        home page to see who's nearby.
      </p>
      <Link to="/" className="btn-primary mt-8 inline-flex">
        Find a cat
      </Link>
    </div>
  );
}
