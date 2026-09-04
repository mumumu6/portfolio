import { navigate } from 'astro:transitions/client';
import { matchesNavigationPath, navigationItems } from '@/lib/navigation';
import { createNavigationIndicatorController } from '@/scripts/navigation-indicator';
import { prefetchNavigationPage, setupNavigationPrefetch } from '@/scripts/navigation-prefetch';

let pendingIndicatorPath: string | null = null;
let pendingIndicatorFinish: (() => void) | null = null;
let earlyNavigationLink: HTMLAnchorElement | null = null;
let pendingScrollY: number | null = null;
let scrollResetGuardY: number | null = null;
let hasClientNavigationStarted = false;
let directionResetTimer = 0;

const nativeScrollTo = window.scrollTo.bind(window);
window.scrollTo = ((...args: Parameters<typeof window.scrollTo>) => {
  const firstArg = args[0] as ScrollToOptions | number | undefined;
  const targetTop = typeof firstArg === 'object' && firstArg !== null ? firstArg.top : args[1];
  if (scrollResetGuardY !== null && targetTop === 0 && scrollResetGuardY > 0) return;
  nativeScrollTo(...args);
}) as typeof window.scrollTo;

const navContainers = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-container]'));
const navigationLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
const sectionLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.section-nav [data-nav-link]'));
const sectionPaths = navigationItems.map((item) => new URL(item.href, window.location.href).pathname);
const siteHomeLink = document.querySelector<HTMLAnchorElement>('[data-site-home]');

setupNavigationPrefetch([...navigationLinks, ...(siteHomeLink ? [siteHomeLink] : [])]);
const indicators = createNavigationIndicatorController(navContainers);

const syncAdaptiveLayout = (sourceDocument: Document = document) => {
  const adaptive = sourceDocument.querySelector('main.site-shell')?.classList.contains('site-shell--adaptive') ?? false;
  document.querySelector('.header-inner')?.classList.toggle('header-inner--adaptive', adaptive);
  document.querySelector('.section-nav')?.classList.toggle('section-nav--adaptive', adaptive);
};

const setActiveNavigation = (pathname: string) => {
  navigationLinks.forEach((link) => {
    const active = matchesNavigationPath(pathname, link.pathname);
    if (link.classList.contains('active') !== active) link.classList.toggle('active', active);

    if (active) {
      if (link.getAttribute('aria-current') !== 'page') link.setAttribute('aria-current', 'page');
    } else if (link.hasAttribute('aria-current')) {
      link.removeAttribute('aria-current');
    }
  });
};

const syncActiveNavigation = () => {
  const currentPath = window.location.pathname;
  const skipPendingAnimation = pendingIndicatorPath === currentPath;
  pendingIndicatorPath = null;
  const indicatorStates = skipPendingAnimation ? [] : indicators.read(currentPath);

  // Keep all geometry reads before this class/attribute write batch.
  setActiveNavigation(currentPath);
  indicators.sync(indicatorStates, skipPendingAnimation);
};

const prepareNavigation = (link: HTMLAnchorElement) => {
  const linkUrl = new URL(link.href, window.location.href);
  if (
    linkUrl.origin !== window.location.origin ||
    (link.target && link.target !== '_self') ||
    link.hasAttribute('download') ||
    (linkUrl.pathname === window.location.pathname && linkUrl.search === window.location.search)
  ) {
    return false;
  }

  // Start the one shared request before reading indicator geometry. If a
  // hover/tap prefetch is already in flight, navigate() consumes that body.
  prefetchNavigationPage(linkUrl.href);
  hasClientNavigationStarted = true;
  window.clearTimeout(directionResetTimer);
  const currentIsSection = sectionPaths.some((path) => matchesNavigationPath(window.location.pathname, path));
  pendingScrollY = link.matches('[data-nav-link]') && currentIsSection ? window.scrollY : null;
  scrollResetGuardY = pendingScrollY;

  const nextLink = sectionLinks.find((candidate) => matchesNavigationPath(linkUrl.pathname, candidate.pathname));
  // Read both indicator origins and targets before changing active classes.
  const indicatorStates = nextLink ? indicators.read(nextLink.pathname) : [];
  setActiveNavigation(linkUrl.pathname);

  if (nextLink) {
    const currentIndex = sectionPaths.findIndex((path) => matchesNavigationPath(window.location.pathname, path));
    const nextIndex = sectionPaths.findIndex((path) => path === nextLink.pathname);
    const direction = nextIndex > currentIndex ? 'forward' : nextIndex < currentIndex ? 'back' : 'none';
    document.documentElement.dataset.navigationDirection = direction;
    pendingIndicatorPath = linkUrl.pathname;
  } else {
    delete document.documentElement.dataset.navigationDirection;
    pendingIndicatorPath = linkUrl.pathname;
  }

  return () => {
    if (nextLink) {
      indicatorStates.forEach((state) => indicators.apply(state));
    } else {
      indicators.hide();
    }
  };
};

const scheduleIndicatorFinish = (finishIndicator: () => void) => {
  pendingIndicatorFinish = finishIndicator;
};

const finishPendingIndicator = () => {
  if (!pendingIndicatorFinish) return;
  const finishIndicator = pendingIndicatorFinish;
  pendingIndicatorFinish = null;
  window.requestAnimationFrame(finishIndicator);
};

const commitNavigation = (link: HTMLAnchorElement) => {
  void navigate(link.href, {
    history: link.dataset.astroHistory === 'replace' ? 'replace' : 'auto',
    sourceElement: link,
  }).finally(() => {
    if (pendingScrollY === null) scrollResetGuardY = null;
  });
};

document.addEventListener(
  'pointerdown',
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>('[data-nav-link], [data-site-home]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const finishIndicator = prepareNavigation(link);
    if (!finishIndicator) return;
    earlyNavigationLink = link;
    // Begin Astro's fetch/view transition from the pointer event. The
    // indicator is only feedback and must not sit on the critical path.
    commitNavigation(link);
    scheduleIndicatorFinish(finishIndicator);
  },
  { capture: true },
);

document.addEventListener(
  'click',
  (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest<HTMLAnchorElement>('[data-nav-link], [data-site-home]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

    if (link === earlyNavigationLink) {
      // Navigation already started on pointerdown. Prevent both the browser's
      // default navigation and Astro's document-level click handler.
      earlyNavigationLink = null;
      event.preventDefault();
      return;
    }

    earlyNavigationLink = null;
    const finishIndicator = prepareNavigation(link);
    if (finishIndicator) {
      event.preventDefault();
      commitNavigation(link);
      scheduleIndicatorFinish(finishIndicator);
    }
  },
  { capture: true },
);

let swipeStart: { x: number; y: number } | null = null;

document.addEventListener(
  'pointerdown',
  (event) => {
    if (event.pointerType === 'mouse' || !window.matchMedia('(max-width: 760px)').matches) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('main.site-shell')) return;
    if (target.closest('a, button, input, textarea, select, summary, pre, code, [data-swipe-ignore]')) return;
    swipeStart = { x: event.clientX, y: event.clientY };
  },
  { passive: true },
);

document.addEventListener(
  'pointerup',
  (event) => {
    if (!swipeStart) return;
    const { x, y } = swipeStart;
    swipeStart = null;

    const deltaX = event.clientX - x;
    const deltaY = event.clientY - y;
    if (Math.abs(deltaX) < 72 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

    const currentIndex = sectionPaths.findIndex((path) => matchesNavigationPath(window.location.pathname, path));
    const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
    const nextPath = sectionPaths[nextIndex];
    const nextLink = sectionLinks.find((link) => link.pathname === nextPath);
    if (currentIndex < 0 || !nextLink) return;

    event.preventDefault();
    const finishIndicator = prepareNavigation(nextLink);
    if (!finishIndicator) return;
    commitNavigation(nextLink);
    scheduleIndicatorFinish(finishIndicator);
  },
  { capture: true },
);

document.addEventListener('pointercancel', () => {
  swipeStart = null;
  // A pointer cancel can follow a touch gesture, but the transition has
  // already started on pointerdown. Do not rewind the active state mid-flight.
  earlyNavigationLink = null;
});

syncAdaptiveLayout();
syncActiveNavigation();
document.addEventListener('astro:before-swap', (event) => {
  const newDocument = (event as Event & { newDocument?: Document }).newDocument;
  const direction = document.documentElement.dataset.navigationDirection;
  if (newDocument) syncAdaptiveLayout(newDocument);
  if (newDocument && direction && direction !== 'none') {
    newDocument.documentElement.dataset.navigationDirection = direction;
  }
});
document.addEventListener('astro:after-swap', () => {
  finishPendingIndicator();
  if (pendingScrollY === null) return;
  const scrollY = pendingScrollY;
  pendingScrollY = null;
  window.scrollTo({ left: 0, top: scrollY, behavior: 'instant' });
  scrollResetGuardY = null;
});
document.addEventListener('astro:page-load', () => {
  finishPendingIndicator();
  if (hasClientNavigationStarted) syncActiveNavigation();
  scrollResetGuardY = null;
  window.clearTimeout(directionResetTimer);
  directionResetTimer = window.setTimeout(() => {
    delete document.documentElement.dataset.navigationDirection;
  }, 420);
});

let resizeFrame = 0;
window.addEventListener(
  'resize',
  () => {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      if (pendingIndicatorPath) return;
      indicators.reposition(window.location.pathname);
    });
  },
  { passive: true },
);
