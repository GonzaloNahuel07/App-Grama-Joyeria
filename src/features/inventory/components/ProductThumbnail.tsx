import { Gem } from 'lucide-react';
import type { ProductImage } from '../../../shared/types/domain';

interface ProductThumbnailProps {
  images: ProductImage[];
  alt: string;
  sizeClass?: string;
}

/**
 * Renders the primary product thumbnail or a neutral jewelry placeholder icon.
 */
export function ProductThumbnail({ images, alt, sizeClass = 'h-12 w-12' }: ProductThumbnailProps) {
  const cover = images[0];

  if (cover) {
    return (
      <img
        src={cover.publicUrl}
        alt={alt}
        className={`${sizeClass} shrink-0 rounded-xl border border-line object-cover bg-surface`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted`}
      aria-label={alt}
    >
      <Gem className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
