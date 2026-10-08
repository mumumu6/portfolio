import { prefetch } from 'astro:prefetch'
import type {
  TransitionBeforePreparationEvent,
  TransitionBeforeSwapEvent,
} from 'astro:transitions/client'
import { applyTheme } from '@/lib/theme'
import { entryTransitionName } from '@/lib/entry-transition'
import '@/scripts/disclosure'
import '@/scripts/image-loading'
import '@/scripts/section-navigation'
import '@/scripts/theme-toggle'

const loadReadingProgress = () => {
  if (document.querySelector('[data-article-controls]'))
    void import('@/scripts/reading-progress')
}

document.addEventListener('astro:page-load', loadReadingProgress)
loadReadingProgress()

const nav = () => document.querySelector<HTMLElement>('[data-nav-container]')
const isEntryDetail = (url: URL) =>
  /^\/(?:blog|works)\/[^/]+\/?$/.test(url.pathname)
const involvesEntry = (from: URL, to: URL) =>
  isEntryDetail(from) || isEntryDetail(to)

const transitionTargets = (root: ParentNode) => {
  const names = new Map<string, HTMLElement[]>()
  for (const element of root.querySelectorAll<HTMLElement>(
    '[style*="view-transition-name"]',
  )) {
    const name = element.style.viewTransitionName
    if (!name || name === 'none') continue
    const elements = names.get(name)
    if (elements) elements.push(element)
    else names.set(name, [element])
  }
  return names
}

/* 両ページに無い名前は本文フェードに含め、単独で移動させない。 */
const keepPairedTransitionNames = (current: Document, next: Document) => {
  const currentNames = transitionTargets(current)
  const nextNames = transitionTargets(next)
  for (const [name, elements] of currentNames) {
    if (nextNames.has(name)) continue
    for (const element of elements) element.style.viewTransitionName = ''
  }
  for (const [name, elements] of nextNames) {
    if (currentNames.has(name)) continue
    for (const element of elements) element.style.viewTransitionName = ''
  }
}

let entryNavigation = 0
const clearEntryParticipants = (target: Document) => {
  target.documentElement.removeAttribute('data-entry-transition-scoped')
  for (const card of target.querySelectorAll('[data-entry-transition-active]'))
    card.removeAttribute('data-entry-transition-active')
}
const selectEntryParticipants = (target: Document, from: URL, to: URL) => {
  clearEntryParticipants(target)
  target.documentElement.setAttribute('data-entry-transition-scoped', '')
  const names = new Set(
    [from, to]
      .filter(isEntryDetail)
      .map((url) =>
        entryTransitionName(`${url.pathname.replace(/\/$/, '')}/`, 'title'),
      ),
  )
  for (const title of target.querySelectorAll<HTMLElement>(
    '.feed-entry .entry-title[style]',
  )) {
    if (names.has(title.style.viewTransitionName))
      title
        .closest('.feed-entry')
        ?.setAttribute('data-entry-transition-active', '')
  }
}

document.addEventListener('astro:before-preparation', (event) => {
  const transition = event as TransitionBeforePreparationEvent
  const current = ++entryNavigation
  const fadeSharedPage = involvesEntry(transition.from, transition.to)
  selectEntryParticipants(document, transition.from, transition.to)
  const loader = transition.loader
  transition.loader = async () => {
    await loader()
    if (transition.signal.aborted || current !== entryNavigation) return
    const next = transition.newDocument
    if (!fadeSharedPage || !next) return
    keepPairedTransitionNames(document, next)
  }
  transition.signal.addEventListener(
    'abort',
    () => {
      if (current !== entryNavigation) return
      clearEntryParticipants(document)
    },
    { once: true },
  )
})

document.addEventListener('astro:before-swap', (event) => {
  const transition = event as TransitionBeforeSwapEvent
  const current = entryNavigation
  selectEntryParticipants(
    transition.newDocument,
    transition.from,
    transition.to,
  )
  const cleanup = () => {
    if (current !== entryNavigation) return
    clearEntryParticipants(document)
  }
  void transition.viewTransition.finished.then(cleanup, cleanup)
})

let pendingNavViewportTop: number | null = null
let navPinGeneration = 0
let previousScrollBehavior: string | null = null
let skipPageSnapshot = false
let pageTransition: { ready: Promise<void> } | null = null
let pageEnterTimer = 0

// transform で隠れている間も、レイアウト上の位置を返す。
const navLayoutTop = (container: HTMLElement) => {
  const rect = container.getBoundingClientRect()
  const shift = new DOMMatrixReadOnly(getComputedStyle(container).transform).m42
  return rect.top - shift
}

const hasSharedPair = (current: Document, next: Document) => {
  const nextNames = transitionTargets(next)
  for (const name of transitionTargets(current).keys()) {
    if (nextNames.has(name)) return true
  }
  return false
}

const pinNavViewport = () => {
  if (pendingNavViewportTop === null) return
  const container = nav()
  if (!container) return
  const documentTop = navLayoutTop(container) + window.scrollY
  const nextScroll = Math.max(0, documentTop - pendingNavViewportTop)
  if (Math.abs(window.scrollY - nextScroll) <= 0.5) return
  const root = document.documentElement
  const previous = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo({ top: nextScroll, behavior: 'instant' })
  root.style.scrollBehavior = previous
}

document.addEventListener('astro:before-swap', (event) => {
  const transition = event as TransitionBeforeSwapEvent
  // 対になるタイトルと画像があるときだけ撮影する。本文全体は撮らない。
  skipPageSnapshot = !hasSharedPair(document, transition.newDocument)
  pageTransition = transition.viewTransition
  if (skipPageSnapshot) transition.viewTransition.skipTransition()

  const traversal = transition.navigationType === 'traverse'
  const currentNav = nav()
  const generation = ++navPinGeneration
  pendingNavViewportTop =
    !traversal && currentNav ? navLayoutTop(currentNav) : null
  const release = () => {
    if (generation !== navPinGeneration) return
    pendingNavViewportTop = null
  }
  void transition.viewTransition.finished.then(release, release)
  if (traversal) {
    if (previousScrollBehavior === null) {
      previousScrollBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
    }
    transition.newDocument.documentElement.style.scrollBehavior = 'auto'
  }
})

const fadeInPage = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const root = document.documentElement
  root.setAttribute('data-page-enter', '')
  window.clearTimeout(pageEnterTimer)
  pageEnterTimer = window.setTimeout(() => {
    root.removeAttribute('data-page-enter')
  }, 160)
}

document.addEventListener('astro:after-swap', () => {
  const transition = pageTransition
  pageTransition = null
  if (skipPageSnapshot || !transition) fadeInPage()
  else void transition.ready.then(fadeInPage, fadeInPage)
  skipPageSnapshot = false
  pinNavViewport()
  void document.fonts.ready.then(pinNavViewport)
  if (previousScrollBehavior !== null) {
    document.documentElement.style.scrollBehavior = previousScrollBehavior
    previousScrollBehavior = null
  }
})

// タッチ操作時だけ、押されたリンクを Astro の先読み機能に渡す。
const coarsePointer = matchMedia('(pointer: coarse)')
const prefetchTouchedLink = (event: Event) => {
  if (!coarsePointer.matches || !(event.target instanceof Element)) return
  const link = event.target.closest<HTMLAnchorElement>('a[href]')
  if (
    link?.origin === location.origin &&
    link.dataset.astroPrefetch !== 'false'
  )
    prefetch(link.href, { ignoreSlowConnection: true })
}
for (const type of ['touchstart', 'mousedown'])
  document.addEventListener(type, prefetchTouchedLink, { passive: true })

const prefetchNavigation = () => {
  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    '[data-nav-link]',
  )) {
    if (link.pathname === location.pathname) continue
    prefetch(link.href)
  }
}
document.addEventListener('astro:page-load', () => {
  if ('requestIdleCallback' in window)
    window.requestIdleCallback(prefetchNavigation, { timeout: 800 })
  else window.setTimeout(prefetchNavigation, 300)
})

document.addEventListener('astro:before-swap', (event) => {
  const { newDocument } = event as TransitionBeforeSwapEvent
  newDocument.documentElement.classList.add('js')
  applyTheme(
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    newDocument,
  )
})
