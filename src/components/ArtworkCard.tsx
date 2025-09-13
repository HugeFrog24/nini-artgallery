import { Artwork } from "@/types/artwork";
import Link from "next/link";

interface ArtworkCardProps {
  artwork: Artwork;
}

export default function ArtworkCard({ artwork }: ArtworkCardProps) {
  return (
    <Link href={`/artwork/${artwork.id}`} className="block w-full">
      <article
        className="group relative bg-white dark:bg-gray-800 rounded-md overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 w-full cursor-pointer"
        aria-labelledby={`title-${artwork.id}`}
      >
      <div
        className="aspect-square w-full"
        style={{ backgroundColor: artwork.imageUrl }}
        role="img"
        aria-label={`${artwork.title} - ${artwork.medium}`}
      />
      <div className="p-2">
        <h3
          id={`title-${artwork.id}`}
          className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate"
        >
          {artwork.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-1" aria-label="Description">
          {artwork.description}
        </p>
        <dl className="text-xs text-gray-500 dark:text-gray-400 grid gap-0.5">
          {artwork.medium && (
            <>
              <dt className="sr-only">Medium</dt>
              <dd className="truncate">{artwork.medium}</dd>
            </>
          )}
          {artwork.dimensions && (
            <>
              <dt className="sr-only">Dimensions</dt>
              <dd className="truncate">{artwork.dimensions}</dd>
            </>
          )}
          {artwork.year && (
            <>
              <dt className="sr-only">Year</dt>
              <dd className="truncate">{artwork.year}</dd>
            </>
          )}
        </dl>
      </div>
      </article>
    </Link>
  );
}