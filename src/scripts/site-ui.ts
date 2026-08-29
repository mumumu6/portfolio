import { applySlowNetworkImagePolicy, closeMenu, setNavigationLoading, setupSiteNavigation } from '@/scripts/site-navigation';
import { setupNavigationPrefetch } from '@/scripts/navigation-prefetch';
import { registerSW } from 'virtual:pwa-register';

setupNavigationPrefetch();
registerSW();
document.addEventListener('astro:page-load', () => {
  closeMenu(true);
  setNavigationLoading(false);
  setupSiteNavigation();
  applySlowNetworkImagePolicy();
});

setupSiteNavigation();
applySlowNetworkImagePolicy();
