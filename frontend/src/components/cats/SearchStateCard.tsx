import type { ReactNode } from "react";

interface SearchStateCardProps {
  icon?: string;
  title: string;
  message: string;
  children?: ReactNode;
}

/** Shared shell for prompt/empty/error states across the search + detail pages. */
export function SearchStateCard({
  icon = "🐾",
  title,
  message,
  children,
}: SearchStateCardProps) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center sm:p-10">
      <div aria-hidden="true" className="text-4xl">
        {icon}
      </div>
      <h2 className="mt-3 text-xl font-semibold text-mauve-700">{title}</h2>
      <p className="mt-2 text-mauve-500">{message}</p>
      {children && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
