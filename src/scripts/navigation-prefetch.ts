type CachedPage = {
  body: string;
  contentType: string;
};

const nativeFetch = window.fetch.bind(window);
const prefetchedPages = new Map<string, Promise<CachedPage | null>>();

const normalizeUrl = (input: RequestInfo | URL) => {
  const value = typeof input === 'string' || input instanceof URL ? input.toString() : input.url;
  return new URL(value, window.location.href).href.split('#', 1)[0];
};

const fetchPage = (url: string) =>
  nativeFetch(url, {
    credentials: 'same-origin',
    headers: { accept: 'text/html' },
  })
    .then(async (response) => {
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || !contentType.includes('text/html')) return null;
      return {
        body: await response.text(),
        contentType,
      };
    })
    .catch(() => null);

const prefetchNavigationPage = (href: string) => {
  const url = normalizeUrl(href);
  const target = new URL(url);
  if (target.origin !== window.location.origin || target.href === window.location.href.split('#', 1)[0]) return;
  if (prefetchedPages.has(url)) return;

  const request = fetchPage(url).then((page) => {
    if (!page) prefetchedPages.delete(url);
    return page;
  });
  prefetchedPages.set(url, request);
};

const cachedFetch: typeof window.fetch = async (input, init) => {
  const request = input instanceof Request ? input : undefined;
  const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
  const accept = new Headers(init?.headers ?? request?.headers).get('accept');
  if (method !== 'GET' || (accept && !accept.includes('text/html'))) return nativeFetch(input, init);

  const url = normalizeUrl(input);
  const cachedPage = prefetchedPages.get(url);
  if (!cachedPage) return nativeFetch(input, init);

  return cachedPage.then((page) => {
    if (!page) {
      prefetchedPages.delete(url);
      return nativeFetch(input, init);
    }

    return new Response(page.body, {
      status: 200,
      headers: { 'content-type': page.contentType },
    });
  });
};

window.fetch = cachedFetch;

const schedulePrefetch = (link: HTMLAnchorElement, delay = 80) => {
  const timer = window.setTimeout(() => prefetchNavigationPage(link.href), delay);
  link.dataset.prefetchTimer = String(timer);
};

const cancelScheduledPrefetch = (link: HTMLAnchorElement) => {
  const timer = Number(link.dataset.prefetchTimer);
  if (!Number.isNaN(timer)) window.clearTimeout(timer);
  delete link.dataset.prefetchTimer;
};

export const setupNavigationPrefetch = (links: HTMLAnchorElement[]) => {
  links.forEach((link) => {
    if (link.dataset.prefetchBound === 'true') return;
    link.dataset.prefetchBound = 'true';

    link.addEventListener('mouseenter', () => schedulePrefetch(link));
    link.addEventListener('mouseleave', () => cancelScheduledPrefetch(link));
    link.addEventListener('focusin', () => schedulePrefetch(link, 0));
  });
};

export { prefetchNavigationPage };
