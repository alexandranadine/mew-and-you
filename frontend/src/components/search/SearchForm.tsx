import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_RADIUS_MILES, RADIUS_OPTIONS_MILES } from '../../lib/searchOptions'

export function SearchForm() {
  const navigate = useNavigate()
  const [location, setLocation] = useState('')
  const [radius, setRadius] = useState(DEFAULT_RADIUS_MILES)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedLocation = location.trim()
    if (!trimmedLocation) {
      setError('Enter a ZIP code or city to start searching.')
      return
    }

    setError(null)
    const params = new URLSearchParams({
      location: trimmedLocation,
      radius: String(radius),
    })
    navigate(`/results?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card flex flex-col gap-4 p-6 sm:p-8"
      noValidate
    >
      <div>
        <label htmlFor="location" className="field-label">
          ZIP code or city
        </label>
        <input
          id="location"
          name="location"
          type="text"
          inputMode="text"
          autoComplete="postal-code"
          placeholder="e.g. 90026 or Pasadena, CA"
          className="field-input"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'location-error' : undefined}
        />
        {error && (
          <p id="location-error" className="mt-1.5 text-sm text-blush-500">
            {error}
          </p>
        )}
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
  )
}
