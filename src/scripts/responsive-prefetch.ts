const responsivePrefetchQuery = window.matchMedia('(max-width: 760px)')

export const syncResponsivePrefetch = () => {
  const strategy = responsivePrefetchQuery.matches ? 'tap' : 'hover'
  document
    .querySelectorAll<HTMLAnchorElement>(
      'a[data-nav-link], a[data-site-home], a[data-astro-prefetch]',
    )
    .forEach((link) => {
      if (link.dataset.astroPrefetch !== 'false')
        link.dataset.astroPrefetch = strategy
    })
}

responsivePrefetchQuery.addEventListener('change', syncResponsivePrefetch)
