import { matchesNavigationPath } from '@/lib/navigation'
import { createNavigationIndicatorController } from '@/scripts/navigation-indicator'

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
    // Start the indicator as soon as the new DOM is swapped in. It can move
    // alongside the page fade instead of waiting for the View Transition to finish.
    if (version !== syncVersion) return
    indicators
      .read(pathname)
      .forEach((state, index) =>
        indicators.apply({ ...state, origin: states[index].origin }),
      )
  } else {
    indicators.reposition(pathname)
  }
}

syncNavigation()
document.addEventListener('astro:after-swap', () => syncNavigation(true))
window.addEventListener('resize', () => syncNavigation(), { passive: true })
