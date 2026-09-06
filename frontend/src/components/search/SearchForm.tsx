import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_RADIUS_MILES,
  RADIUS_OPTIONS_MILES,
} from "../../lib/searchOptions";
import { isValidZipFormat } from "../../lib/zipLookup";

export function SearchForm() {
  const navigate = useNavigate();
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(DEFAULT_RADIUS_MILES);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedZip = zip.trim();
    if (!trimmedZip) {
      setError("Enter a ZIP code to start searching.");
      return;
    }
    if (!isValidZipFormat(trimmedZip)) {
      setError("Please enter a valid 5-digit ZIP code.");
      return;
    }

    setError(null);
    const params = new URLSearchParams({
      zip: trimmedZip,
      radius: String(radius),
    });
    navigate(`/cats?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card flex flex-col gap-3 p-4 text-left sm:gap-4 sm:p-8"
      noValidate
    >
      <div>
        <label htmlFor="zip" className="field-label mb-1 sm:mb-1.5">
          ZIP code
        </label>
        <input
          id="zip"
          name="zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          placeholder="e.g. 91350"
          className="field-input min-h-11"
          value={zip}
          onChange={(event) => setZip(event.target.value)}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "zip-error" : undefined}
        />
        {/* Fixed slot so validation copy does not shove the radius/submit down. */}
        <p
          id="zip-error"
          role={error ? "alert" : undefined}
          className={`mt-1 min-h-5 text-sm text-blush-600 sm:mt-1.5 ${
            error ? "" : "invisible"
          }`}
          aria-hidden={error ? undefined : true}
        >
          {error ?? "\u00a0"}
        </p>
      </div>

      <div>
        <label htmlFor="radius" className="field-label mb-1 sm:mb-1.5">
          Search radius
        </label>
        <select
          id="radius"
          name="radius"
          className="field-input min-h-11"
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        >
          {RADIUS_OPTIONS_MILES.map((miles) => (
            <option key={miles} value={miles}>
              {miles} miles
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="btn-primary min-h-12 w-full sm:mt-1 sm:w-auto"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4 text-cream-50"
        >
          <circle
            cx="8.5"
            cy="8.5"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M13.5 13.5 18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Find cats nearby
      </button>
    </form>
  );
}
