type Theme = 'light' | 'dark';

let menuHideTimer = 0;
let menuFrame = 0;
let escapeBound = false;
let navigationFeedbackInitialized = false;

const readStoredTheme = (): Theme => {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
  } catch {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  }
};

const updateThemeButton = (theme: Theme) => {
  document
    .querySelector<HTMLButtonElement>('[data-theme-toggle]')
    ?.setAttribute('aria-pressed', String(theme === 'dark'));
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document
    .querySelector<HTMLMetaElement>('[data-theme-color]')
    ?.setAttribute('content', theme === 'dark' ? '#090d12' : '#eef1f4');
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Keep the in-memory theme when storage is unavailable.
  }
  updateThemeButton(theme);
};

const animateThemeChange = (theme: Theme) => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => { finished: Promise<void> };
  };

  if (reducedMotion || !transitionDocument.startViewTransition) {
    applyTheme(theme);
    return;
  }

  if (root.hasAttribute('data-theme-transitioning')) return;

  root.setAttribute('data-theme-transitioning', '');
  const transition = transitionDocument.startViewTransition(() => applyTheme(theme));
  transition.finished.finally(() => {
    root.removeAttribute('data-theme-transitioning');
  });
};

const setupTheme = () => {
  updateThemeButton(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((button) => {
    if (button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', () => {
      const nextTheme: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      animateThemeChange(nextTheme);
    });
  });
};

const setupHeaderScroll = () => {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header || header.dataset.scrollBound === 'true') return;

  header.dataset.scrollBound = 'true';
  let previousY = window.scrollY;
  let frame = 0;

  window.addEventListener(
    'scroll',
    () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const currentY = window.scrollY;
        const delta = currentY - previousY;
        const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');

        if (currentY <= 24 || delta < -4 || menu?.hidden === false) {
          header.removeAttribute('data-hidden');
        } else if (currentY > 96 && delta > 4) {
          header.dataset.hidden = 'true';
        }

        if (Math.abs(delta) > 4) previousY = currentY;
      });
    },
    { passive: true },
  );
};

const setMenuOpen = (open: boolean, immediate = false) => {
  const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!menuButton || !menu) return;

  window.clearTimeout(menuHideTimer);
  cancelAnimationFrame(menuFrame);
  if (open) {
    menu.hidden = false;
    menuFrame = requestAnimationFrame(() => {
      menu.dataset.open = 'true';
    });
  } else {
    delete menu.dataset.open;
    if (immediate) menu.hidden = true;
    else {
      menuHideTimer = window.setTimeout(() => {
        if (menu.dataset.open !== 'true') menu.hidden = true;
      }, 190);
    }
  }

  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  header?.removeAttribute('data-hidden');
};

export const closeMenu = (immediate = false) => setMenuOpen(false, immediate);

const setupMobileMenu = () => {
  const menuButton = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-mobile-menu]');
  if (!menuButton || !menu) return;

  if (menuButton.dataset.bound !== 'true') {
    menuButton.dataset.bound = 'true';
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      setMenuOpen(!isOpen);
    });
  }

  if (escapeBound) return;
  escapeBound = true;
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const currentMenu = document.querySelector<HTMLElement>('[data-mobile-menu]');
    if (currentMenu && !currentMenu.hidden) {
      closeMenu();
      document.querySelector<HTMLButtonElement>('[data-menu-toggle]')?.focus();
    }
  });
};

export const setNavigationLoading = (loading: boolean) => {
  document.querySelector('main#main-content')?.setAttribute('aria-busy', String(loading));
};

export const applySlowNetworkImagePolicy = () => {
  if (document.documentElement.dataset.network !== 'slow') return;
  document.querySelectorAll<HTMLImageElement>('img[data-progressive-image]').forEach((image) => {
    image.loading = 'lazy';
    image.setAttribute('fetchpriority', 'low');
  });
};

const setupNavigationFeedback = () => {
  if (navigationFeedbackInitialized) return;
  navigationFeedbackInitialized = true;

  document.addEventListener('astro:before-preparation', () => setNavigationLoading(true));
  document.addEventListener('astro:after-swap', () => setNavigationLoading(false));

  document.addEventListener('astro:before-swap', (event) => {
    const theme = readStoredTheme();
    event.newDocument.documentElement.classList.add('js');
    event.newDocument.documentElement.dataset.theme = theme;
    event.newDocument.documentElement.style.colorScheme = theme;
  });
};

export const setupSiteNavigation = () => {
  setupTheme();
  setupHeaderScroll();
  setupMobileMenu();
  setupNavigationFeedback();
};
