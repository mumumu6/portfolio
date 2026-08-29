import { applySlowNetworkImagePolicy, closeMenu, setNavigationLoading, setupSiteNavigation } from '@/scripts/site-navigation';

const markImageReady = (image: HTMLImageElement, state: 'loaded' | 'error') => {
  delete image.dataset.imageLoading;
  image.dataset.imageState = state;

  const picture = image.closest('picture');
  if (picture) {
    delete picture.dataset.imageLoading;
    picture.dataset.imageState = state;
  }
};

const boundImages = new WeakSet<HTMLImageElement>();

const setupImageLoading = () => {
  document.querySelectorAll<HTMLImageElement>('img[data-progressive-image]').forEach((image) => {
    if (boundImages.has(image)) return;
    boundImages.add(image);

    if (image.complete) {
      markImageReady(image, image.naturalWidth > 0 ? 'loaded' : 'error');
      return;
    }

    image.dataset.imageLoading = 'true';
    image.closest('picture')?.setAttribute('data-image-loading', 'true');
    image.addEventListener('load', () => markImageReady(image, 'loaded'), { once: true });
    image.addEventListener('error', () => markImageReady(image, 'error'), { once: true });
  });
};

// マウスが使える端末はホバー、モバイルと低速回線ではタップ直後に先読みする。
// Astroは低速回線のhover先読みを抑制するため、通信が遅い環境ではtapの方が
// クリック操作と並行してHTML取得を始められる。
const syncPrefetchStrategy = () => {
  const slowNetwork = document.documentElement.dataset.network === 'slow';
  const strategy = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !slowNetwork
    ? 'hover'
    : 'tap';

  document.querySelectorAll<HTMLAnchorElement>('[data-astro-prefetch]').forEach((link) => {
    if (link.dataset.astroPrefetch !== 'false') link.dataset.astroPrefetch = strategy;
  });
};

syncPrefetchStrategy();
document.addEventListener('astro:after-swap', syncPrefetchStrategy);

const registerServiceWorkerWhenIdle = () => {
  const register = () => {
    import('virtual:pwa-register').then(({ registerSW }) => registerSW());
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(register, { timeout: 2000 });
  } else {
    globalThis.setTimeout(register, 1000);
  }
};

registerServiceWorkerWhenIdle();
const setupPage = () => {
  closeMenu(true);
  setNavigationLoading(false);
  setupSiteNavigation();
  applySlowNetworkImagePolicy();
  setupImageLoading();
};

setupPage();
document.addEventListener('astro:page-load', setupPage);
