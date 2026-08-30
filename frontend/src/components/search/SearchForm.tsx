import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DEFAULT_RADIUS_MILES,
  RADIUS_OPTIONS_MILES,
} from "../../lib/searchOptions";
import { isValidZipFormat, SAMPLE_KNOWN_ZIPS } from "../../lib/zipLookup";

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
      className="card flex flex-col gap-4 p-6 sm:p-8"
      noValidate
    >
      <div>
        <label htmlFor="zip" className="field-label">
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
          className="field-input"
          value={zip}
          onChange={(event) => setZip(event.target.value)}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "zip-error" : undefined}
        />
        {error && (
          <p id="zip-error" className="mt-1.5 text-sm text-blush-500">
            {error}
          </p>
        )}
        <p className="mt-1.5 text-xs text-mauve-400">
          Try:{" "}
          {SAMPLE_KNOWN_ZIPS.map((sampleZip, index) => (
            <span key={sampleZip}>
              <button
                type="button"
                onClick={() => setZip(sampleZip)}
                className="underline decoration-dotted underline-offset-2 hover:text-mauve-600"
              >
                {sampleZip}
              </button>
              {index < SAMPLE_KNOWN_ZIPS.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      </div>

      <div>
        <label htmlFor="radius" className="field-label">
          Search radius
        </label>
        <select
          id="radius"
          name="radius"
          className="field-input"
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

      <button type="submit" className="btn-primary mt-2 w-full sm:w-auto">
        <span aria-hidden="true">🔍</span>
        Find cats nearby
      </button>
    </form>
  );
}
