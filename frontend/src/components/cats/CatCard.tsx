import { Link } from 'react-router-dom'
import type { Cat } from '../../types/cat'

const AGE_LABEL: Record<Cat['age'], string> = {
  baby: 'Baby',
  young: 'Young',
  adult: 'Adult',
  senior: 'Senior',
  unknown: 'Unknown age',
}

const SEX_LABEL: Record<Cat['sex'], string> = {
  male: 'Male',
  female: 'Female',
  unknown: 'Unknown',
}

interface CatCardProps {
  cat: Cat
}

export function CatCard({ cat }: CatCardProps) {
  const photo = cat.photos[0]
  const breedLabel = cat.breeds.mixed
    ? `${cat.breeds.primary} mix`
    : cat.breeds.primary

  return (
    <Link
      to={`/cats/${encodeURIComponent(cat.id)}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow-cozy)]"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-blush-100">
        {photo ? (
          <img
            src={photo.thumbnailUrl ?? photo.url}
            alt={`Photo of ${cat.name}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🐱
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-mauve-700">{cat.name}</h3>
          {typeof cat.distanceMiles === 'number' && (
            <span className="pill shrink-0">{cat.distanceMiles.toFixed(1)} mi</span>
          )}
        </div>

        <p className="text-sm text-mauve-500">{breedLabel}</p>

        <p className="text-sm text-mauve-400">
          {AGE_LABEL[cat.age]} &middot; {SEX_LABEL[cat.sex]}
        </p>

        <p className="mt-auto pt-2 text-sm font-medium text-mauve-600">
          {cat.organization.name}
        </p>
      </div>
    </Link>
  )
}
