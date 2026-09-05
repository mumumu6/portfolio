const responsivePrefetchQuery = window.matchMedia('(max-width: 760px)')

export const syncResponsivePrefetch = () => {
  const strategy = responsivePrefetchQuery.matches ? 'tap' : 'hover'

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    if (link.origin === window.location.origin) {
      link.dataset.astroPrefetch = strategy
    }
  })
}

responsivePrefetchQuery.addEventListener('change', syncResponsivePrefetch)
