const markImageReady = (image: HTMLImageElement, state: 'loaded' | 'error') => {
  image.dataset.imageState = state;

  const picture = image.closest('picture');
  if (picture) {
    picture.dataset.imageState = state;
  }
};

const markImageDecoded = async (image: HTMLImageElement) => {
  if (image.naturalWidth === 0) {
    markImageReady(image, 'error');
    return;
  }

  try {
    await image.decode();
  } catch {
    // decode() can reject even after the browser has a usable decoded frame.
    // Do not hide a successfully loaded image just because the optional
    // decode hint failed.
    markImageReady(image, image.naturalWidth > 0 ? 'loaded' : 'error');
    return;
  }

  markImageReady(image, 'loaded');
};

const boundImages = new WeakSet<HTMLImageElement>();
// Native loading="lazy" can still fetch images well below the fold. Keep the
// URLs out of src/srcset until the image is close enough to be useful.
const lazyImageRootMargin = '160px 0px';
let lazyImageObserver: IntersectionObserver | undefined;

const hydrateLazyImage = (image: HTMLImageElement) => {
  const lazySrc = image.dataset.src;
  if (!lazySrc) return;

  const picture = image.closest('picture');
  picture?.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((source) => {
    const srcset = source.dataset.srcset;
    if (!srcset) return;
    source.srcset = srcset;
    delete source.dataset.srcset;
  });

  const srcset = image.dataset.srcset;
  if (srcset) image.srcset = srcset;
  image.src = lazySrc;
  delete image.dataset.src;
  delete image.dataset.srcset;
  picture?.setAttribute('data-image-requested', 'true');
};

export const setupImageLoading = () => {
  lazyImageObserver?.disconnect();
  lazyImageObserver =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const target = entry.target as HTMLElement;
              const image = target.matches('img[data-progressive-image]')
                ? (target as HTMLImageElement)
                : target.querySelector<HTMLImageElement>('img[data-progressive-image]');
              if (!image) return;
              hydrateLazyImage(image);
              lazyImageObserver?.unobserve(target);
            });
          },
          { rootMargin: lazyImageRootMargin },
        )
      : undefined;

  document.querySelectorAll<HTMLImageElement>('img[data-progressive-image]').forEach((image) => {
    if (boundImages.has(image)) {
      if (image.dataset.src) {
        const target = image.closest('picture') ?? image;
        lazyImageObserver?.observe(target);
      }
      return;
    }
    boundImages.add(image);

    image.addEventListener('load', () => void markImageDecoded(image), { once: true });
    image.addEventListener('error', () => markImageReady(image, 'error'), { once: true });

    if (image.dataset.src) {
      const target = image.closest('picture') ?? image;
      if (lazyImageObserver) lazyImageObserver.observe(target);
      else hydrateLazyImage(image);
      return;
    }

    if (image.complete) {
      void markImageDecoded(image);
    }
  });
};
