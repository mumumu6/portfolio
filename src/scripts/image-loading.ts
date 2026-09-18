const linkPreviewSkeletonMinimumMs = 320
const decodedImages = new WeakSet<HTMLImageElement>()
const imageRequestTimes = new WeakMap<HTMLElement, number>()
const imageReadyTimers = new WeakMap<HTMLImageElement, number>()

const commitImageReady = (
  image: HTMLImageElement,
  state: 'loaded' | 'error',
) => {
  image.dataset.imageState = state

  const picture = image.closest('picture')
  if (picture) {
    picture.dataset.imageState = state
  }
}

const markImageReady = (image: HTMLImageElement, state: 'loaded' | 'error') => {
  const picture = image.closest<HTMLElement>('picture')
  if (
    state !== 'loaded' ||
    !picture?.classList.contains('link-preview-card__image')
  ) {
    commitImageReady(image, state)
    return
  }

  decodedImages.add(image)
  const requestedAt = imageRequestTimes.get(picture)
  if (requestedAt === undefined) return

  const remaining = Math.max(
    0,
    linkPreviewSkeletonMinimumMs - (performance.now() - requestedAt),
  )
  const previousTimer = imageReadyTimers.get(image)
  if (previousTimer !== undefined) window.clearTimeout(previousTimer)

  const timer = window.setTimeout(() => {
    imageReadyTimers.delete(image)
    commitImageReady(image, 'loaded')
  }, remaining)
  imageReadyTimers.set(image, timer)
}

const markImageDecoded = async (image: HTMLImageElement) => {
  if (image.naturalWidth === 0) {
    markImageReady(image, 'error')
    return
  }

  try {
    await image.decode()
  } catch {
    // decode() can reject even after the browser has a usable decoded frame.
    // Do not hide a successfully loaded image just because the optional
    // decode hint failed.
    markImageReady(image, image.naturalWidth > 0 ? 'loaded' : 'error')
    return
  }

  markImageReady(image, 'loaded')
}

const boundImages = new WeakSet<HTMLImageElement>()
const lazyImageRootMargin = '160px 0px'
let lazyImageObserver: IntersectionObserver | undefined

export const setupImageLoading = () => {
  lazyImageObserver?.disconnect()
  lazyImageObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return
              const target = entry.target
              if (!(target instanceof HTMLElement)) return
              target.dataset.imageRequested = 'true'
              imageRequestTimes.set(target, performance.now())
              const image = target.querySelector<HTMLImageElement>(
                'img[data-progressive-image]',
              )
              if (image && decodedImages.has(image)) {
                markImageReady(image, 'loaded')
              }
              lazyImageObserver?.unobserve(target)
            })
          },
          { rootMargin: lazyImageRootMargin },
        )
      : undefined

  document
    .querySelectorAll<HTMLImageElement>('img[data-progressive-image]')
    .forEach((image) => {
      const picture = image.closest<HTMLElement>(
        'picture[data-progressive-image]',
      )
      if (!picture) return

      if (boundImages.has(image)) {
        if (!picture.dataset.imageRequested) lazyImageObserver?.observe(picture)
        return
      }
      boundImages.add(image)

      image.addEventListener('load', () => void markImageDecoded(image), {
        once: true,
      })
      image.addEventListener('error', () => markImageReady(image, 'error'), {
        once: true,
      })

      if (!picture.dataset.imageRequested) {
        if (lazyImageObserver) lazyImageObserver.observe(picture)
        else picture.dataset.imageRequested = 'true'
      }

      if (image.complete) {
        void markImageDecoded(image)
      }
    })
}
