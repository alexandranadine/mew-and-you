import type { ReactNode } from "react";

interface SearchStateCardProps {
  icon?: string;
  title: string;
  message: string;
  children?: ReactNode;
  /** Use 1 when this card is the page's primary heading. */
  headingLevel?: 1 | 2;
}

/** Shared shell for prompt/empty/error states across the search + detail pages. */
export function SearchStateCard({
  icon = "🐾",
  title,
  message,
  children,
  headingLevel = 2,
}: SearchStateCardProps) {
  const isError = icon === "⚠️" || icon === "🙀";
  const TitleTag = headingLevel === 1 ? "h1" : "h2";

  return (
    <div
      className="card mx-auto max-w-xl p-8 text-center sm:p-10"
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <div aria-hidden="true" className="text-4xl">
        {icon}
      </div>
      <TitleTag className="mt-3 text-xl font-semibold text-mauve-700">
        {title}
      </TitleTag>
      <p className="mt-2 text-mauve-500">{message}</p>
      {children && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
