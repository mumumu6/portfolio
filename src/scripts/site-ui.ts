import { applySlowNetworkImagePolicy, closeMenu, setNavigationLoading, setupSiteNavigation } from '@/scripts/site-navigation';
import { registerSW } from 'virtual:pwa-register';

// スマホの場合にtapにする
const syncPrefetchStrategy = () => {
  const strategy = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ? 'hover'
    : 'tap';

  document.querySelectorAll<HTMLAnchorElement>('[data-astro-prefetch]').forEach((link) => {
    if (link.dataset.astroPrefetch !== 'false') link.dataset.astroPrefetch = strategy;
  });
};

syncPrefetchStrategy();
document.addEventListener('astro:after-swap', syncPrefetchStrategy);
registerSW();
document.addEventListener('astro:page-load', () => {
  closeMenu(true);
  setNavigationLoading(false);
  setupSiteNavigation();
  applySlowNetworkImagePolicy();
});

setupSiteNavigation();
applySlowNetworkImagePolicy();
