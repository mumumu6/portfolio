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

const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

const indicatorEasing = 'cubic-bezier(0.22, 1, 0.36, 1)'

type IndicatorBox = { x: number; width: number }

let slideGeneration = 0
let deferIndicator = false

const indicatorBox = (container: HTMLElement, indicator: HTMLElement) => {
  const navRect = container.getBoundingClientRect()
  const rect = indicator.getBoundingClientRect()
  return {
    x: rect.left - navRect.left - container.clientLeft,
    width: rect.width,
  }
}

const indicatorIsMoving = (indicator: HTMLElement) =>
  indicator
    .getAnimations()
    .some(
      (animation) =>
        animation.id === 'nav-indicator' &&
        (animation.playState === 'running' ||
          animation.playState === 'pending'),
    )

const measure = (
  container: HTMLElement,
  animate = false,
  origin?: IndicatorBox,
) => {
  const indicator = container.querySelector<HTMLElement>('[data-nav-indicator]')
  const link = container.querySelector<HTMLElement>('a.active')
  const label = link?.querySelector<HTMLElement>('span')
  if (!indicator) return
  if (!link || !label) {
    indicator.hidden = true
    indicator.removeAttribute('data-nav-ready')
    return
  }
  // 記事遷移の準備が終わるまで測り直さない。先に終点へ置くと下線が飛ぶ。
  if (!animate && (deferIndicator || indicatorIsMoving(indicator))) return
  const available = Math.max(36, link.offsetWidth - 16)
  const width = Math.min(available, Math.max(36, label.offsetWidth))
  const nextX = link.offsetLeft + (link.offsetWidth - width) / 2
  const targetKey = `${nextX}:${width}`
  indicator.dataset.navTarget = targetKey
  const ready = indicator.dataset.navReady === 'true' && !indicator.hidden
  let originX = -width
  let originWidth = width
  if (origin) {
    originX = origin.x
    originWidth = origin.width
  } else if (ready) {
    const box = indicatorBox(container, indicator)
    originX = box.x
    originWidth = box.width
  }
  for (const animation of indicator.getAnimations()) {
    if (animation.id === 'nav-indicator') animation.cancel()
  }
  indicator.hidden = false
  indicator.dataset.navReady = 'true'
  indicator.style.width = `${width}px`
  indicator.style.transform = `translate3d(${nextX}px, 0, 0)`
  const moved =
    Math.abs(originX - nextX) >= 0.5 || Math.abs(originWidth - width) >= 0.5
  if (!animate || !moved || reducedMotion() || width <= 0) return
  indicator.style.transition = 'none'
  const animation = indicator.animate(
    [
      {
        transform: `translate3d(${originX}px, 0, 0) scaleX(${originWidth / width})`,
      },
      { transform: `translate3d(${nextX}px, 0, 0) scaleX(1)` },
    ],
    { duration: 200, easing: indicatorEasing, id: 'nav-indicator' },
  )
  const restore = () => {
    indicator.style.transition = ''
    if (indicator.isConnected) measure(container)
  }
  void animation.finished.then(restore, restore)
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
let suspendHide = false
let hideGeneration = 0

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
  if (suspendHide) {
    container.classList.remove('section-nav--hidden')
    lastY = scrollY
    return
  }
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
  const hideToken = ++hideGeneration
  suspendHide = true
  const releaseHide = () => {
    if (hideToken !== hideGeneration) return
    suspendHide = false
    lastY = window.scrollY
  }
  void transition.viewTransition.finished.then(releaseHide, releaseHide)
  // 隠れているバーを戻すとき、縦のスライドは再生しない。
  container.style.transition = 'none'
  container.classList.remove('section-nav--hidden')
  container.getBoundingClientRect()
  container.style.transition = ''
  syncLinks(container, transition.to.pathname)
  // 更新コールバックの中で始めると、記事遷移中は時計が止まって下線が飛ぶ。
  const generation = ++slideGeneration
  deferIndicator = true
  const slide = () => {
    if (generation !== slideGeneration) return
    deferIndicator = false
    if (!container.isConnected) return
    const indicator = container.querySelector<HTMLElement>(
      '[data-nav-indicator]',
    )
    const origin =
      indicator && indicator.dataset.navReady === 'true' && !indicator.hidden
        ? indicatorBox(container, indicator)
        : undefined
    measure(container, true, origin)
  }
  void transition.viewTransition.ready.then(slide, slide)
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
