import { Link } from "react-router-dom";
import { PawDivider } from "../components/decorative/PawDivider";
import { PageMeta } from "../components/seo/PageMeta";
import { brand } from "../config/brand";
import { aboutSeo } from "../config/seo";

const howItWorks = [
  {
    step: "1",
    title: "Enter your ZIP",
    body: "Tell us roughly where you are so we can look nearby.",
  },
  {
    step: "2",
    title: "Discover cats",
    body: "Browse listings gathered from shelters and rescues in one place.",
  },
  {
    step: "3",
    title: "Adopt through them",
    body: "When you find a match, continue with the shelter or rescue that listed them.",
  },
] as const;

export function AboutPage() {
  return (
    <div>
      <PageMeta
        title={aboutSeo.title}
        description={aboutSeo.description}
        canonicalPath={aboutSeo.canonicalPath}
      />

      {/* Hero */}
      <section
        aria-labelledby="about-hero-heading"
        className="relative overflow-hidden px-6 pt-14 pb-6 sm:pt-16 sm:pb-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-blush-100 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-16 h-56 w-56 rounded-full bg-sage-100 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="pill mb-4 px-4 py-1.5 text-[13px]">
            A little about us
          </span>
          <h1
            id="about-hero-heading"
            className="text-4xl font-semibold text-mauve-700 sm:text-5xl"
          >
            About {brand.name}
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-mauve-500">
            A soft, simple way to find adoptable cats in {brand.serviceArea} —
            then meet them through the people who know them best.
          </p>
        </div>
      </section>

      {/* Why Mew & You */}
      <section
        aria-labelledby="about-why-heading"
        className="mx-auto max-w-5xl px-6 pt-2 pb-10 sm:pt-4 sm:pb-14"
      >
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <p className="font-display text-sm font-medium tracking-wide text-blush-500">
              Why {brand.name}?
            </p>
            <h2
              id="about-why-heading"
              className="mt-2 text-2xl font-semibold text-mauve-700 sm:text-3xl"
            >
              One cozy place to look
            </h2>
            <p className="mt-4 leading-relaxed text-mauve-500">
              Placeholder: searching many shelter and rescue sites is a lot of
              tabs. We gather listings so you can browse calmly, then go
              straight to the organization when you&apos;re ready.
            </p>
            <p className="mt-3 leading-relaxed text-mauve-500">
              Placeholder: built for {brand.serviceArea} — local first, soft on
              the eyes, and honest about what we are (and aren&apos;t).
            </p>
          </div>

          <div
            aria-hidden="true"
            className="relative mx-auto flex w-full max-w-lg items-center justify-center"
          >
            <div className="absolute inset-x-4 inset-y-8 rounded-[3rem] bg-gradient-to-br from-blush-50 via-cream-100 to-sage-100 blur-xl sm:inset-y-10" />
            <img
              src="/images/mew-and-you-cat-peek.png"
              alt=""
              width={440}
              height={220}
              loading="lazy"
              decoding="async"
              className="relative z-10 w-full max-w-[440px] object-contain select-none"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="about-how-heading"
        className="mx-auto max-w-5xl px-6 pt-10 pb-8 sm:pt-14"
      >
        <div className="text-center">
          <p className="font-display text-sm font-medium tracking-wide text-blush-500">
            Nice and simple
          </p>
          <h2
            id="about-how-heading"
            className="mt-2 text-2xl font-semibold text-mauve-700 sm:text-3xl"
          >
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-mauve-500">
            Three gentle steps from ZIP code to shelter door.
          </p>
        </div>

        <ol className="mt-8 grid gap-5 sm:grid-cols-3 sm:gap-6">
          {howItWorks.map((item, index) => (
            <li
              key={item.step}
              className={`rounded-[2rem] px-6 py-7 text-center sm:text-left ${
                index % 2 === 0 ? "bg-blush-50/70" : "bg-cream-200/60"
              }`}
            >
              <span className="font-display text-4xl font-semibold text-blush-200">
                <span className="sr-only">Step </span>
                {item.step}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold text-mauve-700">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mauve-500">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <PawDivider />

      {/* Trust / transparency */}
      <section
        aria-labelledby="about-trust-heading"
        className="mx-auto max-w-5xl px-6 pb-8"
      >
        <div className="relative overflow-hidden rounded-[2rem] bg-blush-50/60 px-6 py-10 sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blush-200/50 blur-2xl"
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="font-display text-sm font-medium tracking-wide text-blush-500">
              Good to know
            </p>
            <h2
              id="about-trust-heading"
              className="mt-2 text-2xl font-semibold text-mauve-700 sm:text-3xl"
            >
              A discovery tool — not the adoption desk
            </h2>
            <div className="mt-5 space-y-4">
              <p className="leading-relaxed text-mauve-500">
                Placeholder: {brand.name} helps you find cats. We do not house,
                foster, or process adoptions ourselves.
              </p>
              <p className="leading-relaxed text-mauve-500">
                Placeholder: listings come from shelters and rescues. Cats move
                quickly — always confirm availability and next steps with the
                organization before you visit.
              </p>
              <p className="leading-relaxed text-mauve-500">
                Placeholder: they know each cat best. When you&apos;re ready, we
                send you to their page to continue.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PawDivider />

      {/* Mission callout */}
      <section
        aria-labelledby="about-mission-heading"
        className="mx-auto max-w-5xl px-6 pb-10 text-center sm:pb-14"
      >
        <div className="mx-auto max-w-2xl">
          <p className="font-display text-sm font-medium tracking-wide text-blush-500">
            Our soft goal
          </p>
          <h2
            id="about-mission-heading"
            className="mt-3 text-3xl font-semibold text-mauve-700 sm:text-4xl"
          >
            More cats finding the right couches
          </h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-mauve-500">
            Placeholder: make local adoption browsing a little calmer, clearer,
            and kinder — then get out of the way so shelters and rescues can do
            what they do best.
          </p>
        </div>
      </section>

      {/* Closing CTA */}
      <section
        aria-labelledby="about-cta-heading"
        className="mx-auto max-w-2xl px-6 pt-6 pb-20 text-center"
      >
        <h2
          id="about-cta-heading"
          className="text-2xl font-semibold text-mauve-700"
        >
          Ready to peek around?
        </h2>
        <p className="mt-3 text-mauve-500">
          Start with a ZIP on the home page and see who&apos;s nearby.
        </p>
        <Link to="/" className="btn-primary mt-8 inline-flex">
          Find a cat
        </Link>
      </section>
    </div>
  );
}
