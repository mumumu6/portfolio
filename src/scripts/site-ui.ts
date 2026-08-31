import {
  applySlowNetworkImagePolicy,
  closeMenu,
  setNavigationLoading,
  setupSiteNavigation,
} from '@/scripts/site-navigation';

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
const boundDisclosures = new WeakSet<HTMLDetailsElement>();
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

const setupDisclosureAnimations = () => {
  document.querySelectorAll<HTMLDetailsElement>('details').forEach((details) => {
    if (boundDisclosures.has(details)) return;
    const content = details.querySelector<HTMLElement>('[data-disclosure-content]');
    const summary = details.querySelector<HTMLElement>(':scope > summary');
    if (!content || !summary) return;

    boundDisclosures.add(details);
    let animationFrame = 0;
    let finishTimer = 0;
    let isClosing = false;
    let closeTransitionStarted = false;

    const clearPendingAnimation = () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(finishTimer);
    };

    const setExpandedHeight = () => {
      content.style.maxHeight = `${content.scrollHeight}px`;
    };

    const measureExpandedHeight = () => {
      const previousTransition = content.style.transition;
      const previousMaxHeight = content.style.maxHeight;
      content.style.transition = 'none';
      content.style.maxHeight = 'none';
      const expandedHeight = content.scrollHeight;
      content.style.maxHeight = previousMaxHeight;
      void content.offsetHeight;
      content.style.transition = previousTransition;
      return expandedHeight;
    };

    const finishClose = () => {
      window.clearTimeout(finishTimer);
      isClosing = false;
      closeTransitionStarted = false;
      details.open = false;
      details.removeAttribute('data-closing');
      content.classList.remove('is-open');
      content.style.maxHeight = '0px';
    };

    const openDisclosure = (animate = true) => {
      clearPendingAnimation();
      isClosing = false;
      closeTransitionStarted = false;
      details.removeAttribute('data-closing');
      details.open = true;

      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        content.classList.add('is-open');
        content.style.maxHeight = 'none';
        return;
      }

      content.style.maxHeight = '0px';
      void content.offsetHeight;
      animationFrame = requestAnimationFrame(() => {
        if (!details.open) return;
        content.classList.add('is-open');
        const expandedHeight = measureExpandedHeight();
        animationFrame = requestAnimationFrame(() => {
          if (details.open) content.style.maxHeight = `${expandedHeight}px`;
        });
      });
    };

    const closeDisclosure = () => {
      clearPendingAnimation();
      isClosing = true;
      closeTransitionStarted = false;
      details.dataset.closing = 'true';

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishClose();
        return;
      }

      content.classList.add('is-measuring');
      setExpandedHeight();
      void content.offsetHeight;
      content.classList.remove('is-open');
      void content.offsetHeight;
      content.classList.remove('is-measuring');
      animationFrame = requestAnimationFrame(() => {
        closeTransitionStarted = true;
        content.style.maxHeight = '0px';
      });
      finishTimer = window.setTimeout(finishClose, 480);
    };

    summary.addEventListener('click', (event) => {
      event.preventDefault();
      if (details.open && !isClosing) closeDisclosure();
      else openDisclosure();
    });

    content.addEventListener('transitionend', (event) => {
      if (event.target !== content) return;
      if (event.propertyName !== 'max-height') return;
      if (isClosing && closeTransitionStarted) {
        finishClose();
      }
    });

    if (details.open) openDisclosure(false);
    else content.style.maxHeight = '0px';
  });
};

const setupImageLoading = () => {
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

const registerServiceWorkerWhenIdle = () => {
  const register = () => {
    import('virtual:pwa-register').then(({ registerSW }) => registerSW());
  };

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      // Start after the document is interactive, rather than waiting for
      // every eager image to finish loading. This lets the next navigation
      // become SW-controlled sooner on slow networks.
      window.requestIdleCallback(register, { timeout: 1200 });
    } else {
      globalThis.setTimeout(register, 1200);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
};

registerServiceWorkerWhenIdle();
const setupPage = () => {
  closeMenu(true);
  setNavigationLoading(false);
  setupSiteNavigation();
  applySlowNetworkImagePolicy();
  setupImageLoading();
  setupDisclosureAnimations();
};

setupPage();
document.addEventListener('astro:page-load', setupPage);
