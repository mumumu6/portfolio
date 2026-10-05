import type {
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
} from 'astro:transitions/client'
import { matchesNavigationPath } from '@/lib/navigation'

const nav = () => document.querySelector<HTMLElement>('[data-nav-container]')

const withSlash = (pathname: string) =>
  pathname.endsWith('/') ? pathname : `${pathname}/`

const syncLinks = (container: HTMLElement, pathname: string) => {
  for (const link of container.querySelectorAll<HTMLAnchorElement>(
    '[data-nav-link]',
  )) {
    const active =
      matchesNavigationPath(pathname, link.pathname) ||
      matchesNavigationPath(withSlash(pathname), link.pathname)
    link.classList.toggle('active', active)
    if (active) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  }
}

const measure = (container: HTMLElement) => {
  const indicator = container.querySelector<HTMLElement>('[data-nav-indicator]')
  const link = container.querySelector<HTMLElement>('a.active')
  const label = link?.querySelector<HTMLElement>('span')
  if (!indicator) return
  if (!link || !label) {
    indicator.hidden = true
    indicator.removeAttribute('data-nav-ready')
    return
  }
  const available = Math.max(36, link.offsetWidth - 16)
  const width = Math.min(available, Math.max(36, label.offsetWidth))
  indicator.hidden = false
  indicator.dataset.navReady = 'true'
  indicator.style.width = `${width}px`
  indicator.style.transform = `translate3d(${link.offsetLeft + (link.offsetWidth - width) / 2}px, 0, 0)`
}

const measureCurrent = () => {
  const container = nav()
  if (container) measure(container)
}

let stickyStart = 0
let lastY = 0
let scrollFrame = 0
let resizeFrame = 0
let activePreparation: AbortSignal | undefined

const refreshSticky = () => {
  const profile = document.querySelector('.profile-header')
  stickyStart = profile
    ? profile.getBoundingClientRect().bottom + window.scrollY
    : 0
}

const updateVisibility = () => {
  scrollFrame = 0
  const container = nav()
  if (!container) return
  const scrollY = window.scrollY
  const delta = scrollY - lastY
  if (scrollY <= 4 || scrollY < stickyStart) {
    container.classList.remove('section-nav--hidden')
    lastY = scrollY
  } else if (Math.abs(delta) >= 8) {
    container.classList.toggle('section-nav--hidden', delta > 0)
    lastY = scrollY
  }
}

window.addEventListener(
  'scroll',
  () => {
    if (scrollFrame) return
    scrollFrame = requestAnimationFrame(updateVisibility)
  },
  { passive: true },
)

window.addEventListener(
  'resize',
  () => {
    if (resizeFrame) return
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0
      refreshSticky()
      measureCurrent()
    })
  },
  { passive: true },
)

document.addEventListener('astro:before-preparation', (event) => {
  const { signal } = event as TransitionBeforePreparationEvent
  activePreparation = signal
  nav()?.setAttribute('aria-busy', 'true')
  signal.addEventListener(
    'abort',
    () => {
      if (activePreparation !== signal) return
      activePreparation = undefined
      nav()?.removeAttribute('aria-busy')
    },
    { once: true },
  )
})

document.addEventListener('astro:before-swap', (event) => {
  const transition = event as TransitionBeforeSwapEvent
  const container = nav()
  if (!container) return
  container.classList.remove('section-nav--hidden')
  syncLinks(container, transition.to.pathname)
  measure(container)
})

document.addEventListener('astro:after-swap', () => {
  activePreparation = undefined
  nav()?.removeAttribute('aria-busy')
  lastY = window.scrollY
  refreshSticky()
  measureCurrent()
})

const start = () => {
  const container = nav()
  if (!container) return
  syncLinks(container, window.location.pathname)
  lastY = window.scrollY
  refreshSticky()
  measure(container)
  void document.fonts.ready.then(() => {
    if (nav()) measureCurrent()
  })
}

document.addEventListener('astro:page-load', start)
start()
