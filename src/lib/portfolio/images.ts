import type { ImageMetadata } from 'astro'
import type { FeedImage } from '@/lib/portfolio/types'

type GeneratedBlogImage = {
  asset: string
  alt: string
  source?: string
}

const blogImages = import.meta.glob('/src/assets/images/blog/*-1440.webp', {
  eager: true,
  import: 'default',
}) as Record<string, ImageMetadata>

export const resolveBlogImage = (
  image: GeneratedBlogImage | undefined,
): FeedImage | undefined => {
  if (!image) return undefined

  const src = blogImages[`/src/assets/images/blog/${image.asset}-1440.webp`]
  if (!src) {
    throw new Error(
      `Generated blog image was not found: ${image.asset}-1440.webp`,
    )
  }

  return {
    src,
    alt: image.alt,
    width: src.width,
    height: src.height,
    source: image.source,
  }
}
