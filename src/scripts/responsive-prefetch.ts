// Browser zoom changes CSS pixels, but it does not change the input device.
// Keep mouse users on hover prefetch even when a zoomed desktop looks narrow.
const touchInputQuery = window.matchMedia('(pointer: coarse)')

export const syncResponsivePrefetch = () => {
  const strategy = touchInputQuery.matches ? 'tap' : 'hover'

  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    if (link.origin === window.location.origin) {
      link.dataset.astroPrefetch = strategy
    }
  })
}

touchInputQuery.addEventListener('change', syncResponsivePrefetch)
