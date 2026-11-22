'use client';
import { classPictureUrl } from '@/lib/api/class-picture';
/** Shared class photo with a local fallback if an uploaded image cannot be served. */
export default function ClassPicture({
  imagePath,
  name,
  ...props
}: {
  imagePath?: string | null;
  name: string;
  className?: string;
}) {
  const fallback =
    '/images/' + (name.toLowerCase().includes('yoga') ? 'yoga' : 'strength') + '.jpg';
  return (
    <img
      key={imagePath || fallback}
      src={classPictureUrl(imagePath) || fallback}
      alt={name + ' class'}
      {...props}
      onError={(event) => {
        if (event.currentTarget.dataset.fallback) return;
        event.currentTarget.dataset.fallback = 'true';
        event.currentTarget.src = fallback;
      }}
    />
  );
}
