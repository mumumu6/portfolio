const INTENT_DELAY_MS = 80;

let initialized = false;
let intentTimer: number | undefined;
let pendingIntentUrl: string | undefined;

const prefetchedUrls = new Set<string>();
const prefetchesInFlight = new Set<string>();

const hasConstrainedConnection = () => {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  return Boolean(
    connection?.saveData ||
      /(^|-)2g$/.test(connection?.effectiveType ?? ''),
  );
};

const toInternalPageUrl = (link: HTMLAnchorElement) => {
  if (
    link.hasAttribute('download') ||
    (link.target && link.target !== '_self') ||
    link.relList.contains('external')
  ) {
    return undefined;
  }

  const url = new URL(link.href, location.href);
  if (
    url.origin !== location.origin ||
    !['http:', 'https:'].includes(url.protocol)
  ) {
    return undefined;
  }

  url.hash = '';
  const currentUrl = new URL(location.href);
  currentUrl.hash = '';
  return url.href === currentUrl.href ? undefined : url.href;
};

const findInternalLink = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return undefined;
  const link = target.closest<HTMLAnchorElement>('a[href]');
  return link && toInternalPageUrl(link) ? link : undefined;
};

const prefetchStylesheets = async (html: string, pageUrl: string) => {
  const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
  const stylesheetUrls = new Set<string>();

  parsedDocument
    .querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]')
    .forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const stylesheetUrl = new URL(href, pageUrl);
      if (stylesheetUrl.origin === location.origin) {
        stylesheetUrls.add(stylesheetUrl.href);
      }
    });

  await Promise.allSettled(
    [...stylesheetUrls].map((url) =>
      fetch(url, {
        credentials: 'same-origin',
        headers: { Accept: 'text/css,*/*;q=0.1' },
      }),
    ),
  );
};

const prefetchPage = async (url: string) => {
  if (prefetchedUrls.has(url) || prefetchesInFlight.has(url)) return;
  prefetchesInFlight.add(url);

  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: {
        Accept: 'text/html',
        'X-Portfolio-Prefetch': 'html',
      },
    });
    if (
      !response.ok ||
      !response.headers.get('content-type')?.includes('text/html')
    ) {
      return;
    }

    await prefetchStylesheets(await response.text(), response.url || url);
    prefetchedUrls.add(url);
  } catch {
    // Intent prefetch is optional. A normal click can retry through navigation.
  } finally {
    prefetchesInFlight.delete(url);
  }
};

const cancelPendingIntent = (url?: string) => {
  if (url && pendingIntentUrl !== url) return;
  window.clearTimeout(intentTimer);
  intentTimer = undefined;
  pendingIntentUrl = undefined;
};

const scheduleIntentPrefetch = (link: HTMLAnchorElement) => {
  if (hasConstrainedConnection()) return;

  const url = toInternalPageUrl(link);
  if (
    !url ||
    pendingIntentUrl === url ||
    prefetchedUrls.has(url) ||
    prefetchesInFlight.has(url)
  ) {
    return;
  }

  cancelPendingIntent();
  pendingIntentUrl = url;
  intentTimer = window.setTimeout(() => {
    pendingIntentUrl = undefined;
    intentTimer = undefined;
    void prefetchPage(url);
  }, INTENT_DELAY_MS);
};

export const setupNavigationPrefetch = () => {
  if (initialized) return;
  initialized = true;

  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch') return;
    const link = findInternalLink(event.target);
    if (
      !link ||
      (event.relatedTarget instanceof Node && link.contains(event.relatedTarget))
    ) {
      return;
    }
    scheduleIntentPrefetch(link);
  });

  document.addEventListener('pointerout', (event) => {
    const link = findInternalLink(event.target);
    if (
      !link ||
      (event.relatedTarget instanceof Node && link.contains(event.relatedTarget))
    ) {
      return;
    }
    const url = toInternalPageUrl(link);
    if (url) cancelPendingIntent(url);
  });

  document.addEventListener('focusin', (event) => {
    const link = findInternalLink(event.target);
    if (link) scheduleIntentPrefetch(link);
  });

  document.addEventListener('focusout', (event) => {
    const link = findInternalLink(event.target);
    const url = link && toInternalPageUrl(link);
    if (url) cancelPendingIntent(url);
  });
};
