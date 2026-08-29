import type { ImageMetadata } from 'astro';
import type { FeedImage } from '@/lib/portfolio/types';

type GeneratedBlogImage = {
  asset: string;
  alt: string;
  source?: string;
};

const blogImages = import.meta.glob('/src/assets/images/blog/*.{avif,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>;

const imageWidths = [480, 960, 1440];

export const resolveBlogImage = (image: GeneratedBlogImage | undefined): FeedImage | undefined => {
  if (!image) return undefined;

  const variants = imageWidths.map((width) => ({
    width,
    avif: blogImages[`/src/assets/images/blog/${image.asset}-${width}.avif`],
    webp: blogImages[`/src/assets/images/blog/${image.asset}-${width}.webp`],
  }));
  const missing = variants.find((variant) => !variant.avif || !variant.webp);
  if (missing) {
    throw new Error(`Generated blog image variant was not found: ${image.asset}-${missing.width}`);
  }
  const largest = variants.at(-1)!;

  return {
    src: largest.webp,
    variants,
    alt: image.alt,
    width: largest.webp.width,
    height: largest.webp.height,
    source: image.source,
  };
};
