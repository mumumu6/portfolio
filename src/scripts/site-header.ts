import { matchesNavigationPath } from '@/lib/navigation'
import { createNavigationIndicatorController } from '@/scripts/navigation-indicator'

let transitionFinished: Promise<unknown> = Promise.resolve()
let syncVersion = 0

const syncNavigation = (animate = false) => {
  const version = ++syncVersion
  const pathname = location.pathname
  const containers = Array.from(
    document.querySelectorAll<HTMLElement>('[data-nav-container]'),
  )
  const indicators = createNavigationIndicatorController(containers)
  const states = indicators.read(pathname)
  document
    .querySelectorAll<HTMLAnchorElement>('[data-nav-link]')
    .forEach((link) => {
      const active = matchesNavigationPath(pathname, link.pathname)
      link.classList.toggle('active', active)
      if (active) link.setAttribute('aria-current', 'page')
      else link.removeAttribute('aria-current')
    })
  const adaptive =
    document
      .querySelector('main')
      ?.classList.contains('site-shell--adaptive') ?? false
  document
    .querySelector('.header-inner')
    ?.classList.toggle('header-inner--adaptive', adaptive)
  document
    .querySelector('.section-nav')
    ?.classList.toggle('section-nav--adaptive', adaptive)
  if (animate) {
    // Root snapshots cover the live tabs. Start their motion only after the crossfade.
    void transitionFinished.then(() => {
      if (version !== syncVersion) return
      indicators
        .read(pathname)
        .forEach((state, index) =>
          indicators.apply({ ...state, origin: states[index].origin }),
        )
    })
  } else {
    indicators.reposition(pathname)
  }
}

// Let ClientRouter handle clicks and history. Sync persisted tabs only with the live URL and DOM.
syncNavigation()
document.addEventListener('astro:before-swap', (event) => {
  transitionFinished = event.viewTransition.finished.catch(() => {})
})
document.addEventListener('astro:after-swap', () => syncNavigation(true))
window.addEventListener('resize', () => syncNavigation(), { passive: true })
