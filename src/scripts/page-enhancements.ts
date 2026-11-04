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

const addHeadingPermalinks = () => {
  for (const heading of document.querySelectorAll<HTMLElement>(
    '[data-article-prose] h2[id], [data-article-prose] h3[id], [data-article-prose] h4[id]',
  )) {
    if (heading.querySelector('[data-heading-permalink]')) continue

    const link = document.createElement('a')
    link.dataset.headingPermalink = ''
    link.href = `#${encodeURIComponent(heading.id)}`
    link.setAttribute('aria-label', `${heading.textContent?.trim()}へのリンク`)
    heading.append(link)
  }
}

const scrollToHash = () => {
  if (!location.hash) return
  const id = decodeURIComponent(location.hash.slice(1))
  document
    .querySelector<HTMLElement>(`#${CSS.escape(id)}`)
    ?.scrollIntoView({ block: 'start' })
}

document.addEventListener('astro:page-load', loadReadingProgress)
document.addEventListener('astro:page-load', addHeadingPermalinks)
document.addEventListener('astro:page-load', () =>
  requestAnimationFrame(scrollToHash),
)
window.addEventListener('hashchange', scrollToHash)
loadReadingProgress()
addHeadingPermalinks()

const nav = () => document.querySelector<HTMLElement>('[data-nav-container]')
const isEntryDetail = (url: URL) =>
  /^\/(?:blog|works)\/[^/]+\/?$/u.test(url.pathname)

let entryNavigation = 0
const clearEntryParticipants = (target: Document) => {
  delete target.documentElement.dataset.entryTransitionScoped
  for (const card of target.querySelectorAll<HTMLElement>(
    '[data-entry-transition-active]',
  ))
    delete card.dataset.entryTransitionActive
}
const selectEntryParticipants = (target: Document, from: URL, to: URL) => {
  clearEntryParticipants(target)
  target.documentElement.dataset.entryTransitionScoped = ''
  const names = new Set(
    [from, to]
      .filter((url) => isEntryDetail(url))
      .map((url) =>
        entryTransitionName(`${url.pathname.replace(/\/$/u, '')}/`, 'title'),
      ),
  )
  for (const title of target.querySelectorAll<HTMLElement>(
    '[data-feed-entry] [data-entry-title][style]',
  )) {
    if (names.has(title.style.viewTransitionName)) {
      const entry = title.closest<HTMLElement>('[data-feed-entry]')
      if (entry) entry.dataset.entryTransitionActive = ''
    }
  }
}

document.addEventListener('astro:before-preparation', (event) => {
  const transition = event as TransitionBeforePreparationEvent
  const current = ++entryNavigation
  selectEntryParticipants(document, transition.from, transition.to)
  transition.signal.addEventListener(
    'abort',
    () => {
      if (current === entryNavigation) clearEntryParticipants(document)
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
    if (current === entryNavigation) clearEntryParticipants(document)
  }
  void transition.viewTransition.finished.then(cleanup, cleanup)
})

let pendingViewportTop: number | null = null
let previousScrollBehavior: string | null = null
let fadePageContent = false
let pageEnterTimer = 0

const getStickyStart = () => {
  const profile = document.querySelector<HTMLElement>('[data-profile-header]')
  return profile ? profile.getBoundingClientRect().bottom + window.scrollY : 0
}

document.addEventListener('astro:before-swap', (event) => {
  const transition = event as TransitionBeforeSwapEvent
  // 一覧同士は画面全体を撮影しない。本文のフェードは入れ替え後に付ける。
  fadePageContent =
    !isEntryDetail(transition.from) && !isEntryDetail(transition.to)
  if (fadePageContent) transition.viewTransition.skipTransition()

  const traversal = transition.navigationType === 'traverse'
  const currentNav = nav()
  pendingViewportTop =
    !traversal && transition.newDocument.querySelector('[data-profile-header]')
      ? Math.max(0, currentNav?.getBoundingClientRect().top ?? 0)
      : null
  if (traversal) {
    if (previousScrollBehavior === null) {
      previousScrollBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
    }
    transition.newDocument.documentElement.style.scrollBehavior = 'auto'
  }
})

document.addEventListener('astro:after-swap', () => {
  if (
    fadePageContent &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    const root = document.documentElement
    root.dataset.pageEnter = ''
    window.clearTimeout(pageEnterTimer)
    pageEnterTimer = window.setTimeout(() => {
      delete root.dataset.pageEnter
    }, 180)
  }
  fadePageContent = false
  if (pendingViewportTop !== null) {
    window.scrollTo({
      top: Math.max(0, getStickyStart() - pendingViewportTop),
      behavior: 'instant',
    })
    pendingViewportTop = null
  }
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

document.addEventListener('astro:before-swap', (event) => {
  const { newDocument } = event as TransitionBeforeSwapEvent
  newDocument.documentElement.classList.add('js')
  applyTheme(
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
    newDocument,
  )
})
