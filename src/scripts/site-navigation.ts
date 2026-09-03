type Theme = 'light' | 'dark';

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
  setupNavigationFeedback();
};
