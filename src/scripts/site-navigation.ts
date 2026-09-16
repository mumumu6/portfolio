import { matchesNavigationPath } from '@/lib/navigation'
import { createNavigationIndicatorController } from '@/scripts/navigation-indicator'
import { swapFunctions } from 'astro:transitions/client'

type Theme = 'light' | 'dark'

const readStoredTheme = (): Theme => {
  try {
    return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  } catch {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  }
}

const updateThemeButtons = (theme: Theme) => {
  document
    .querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')
    .forEach((button) => {
      button.setAttribute('aria-pressed', String(theme === 'dark'))
      button.setAttribute(
        'aria-label',
        theme === 'dark'
          ? 'ライトテーマに切り替える'
          : 'ダークテーマに切り替える',
      )
    })
}

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document
    .querySelector<HTMLMetaElement>('[data-theme-color]')
    ?.setAttribute('content', theme === 'dark' ? '#090d12' : '#eef1f4')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // Keep the in-memory theme when storage is unavailable.
  }
  updateThemeButtons(theme)
}

const animateThemeChange = (theme: Theme) => {
  const root = document.documentElement
  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches
  const transitionDocument = document as Document & {
    startViewTransition?: (callback: () => void) => {
      finished: Promise<void>
    }
  }

  if (reducedMotion || !transitionDocument.startViewTransition) {
    applyTheme(theme)
    return
  }

  if (root.hasAttribute('data-theme-transitioning')) return

  root.setAttribute('data-theme-transitioning', '')
  const transition = transitionDocument.startViewTransition(() =>
    applyTheme(theme),
  )
  transition.finished.finally(() => {
    root.removeAttribute('data-theme-transitioning')
  })
}

const setupTheme = () => {
  const theme =
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  updateThemeButtons(theme)
  document
    .querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')
    .forEach((button) => {
      if (button.dataset.bound === 'true') return
      button.dataset.bound = 'true'
      button.addEventListener('click', () => {
        const nextTheme: Theme =
          document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
        animateThemeChange(nextTheme)
      })
    })
}

let pendingPathname: string | null = null
let pendingNavigationType: 'push' | 'replace' | 'traverse' | null = null
let pendingScroll: { viewportTop: number } | null = null
let scrollResetGuardY: number | null = null
let traversalScrollBehavior: string | null = null
let traversalRestoreFrame: number | null = null
let scrollFrame: number | null = null
let historyScrollFrame: number | null = null
let navigationFeedbackInitialized = false
let navigationVisibilityInitialized = false
let navigationVisibilityFrame: number | null = null
let previousNavigationScrollY = window.scrollY

const nativeScrollTo = window.scrollTo.bind(window)
window.scrollTo = ((...args: Parameters<typeof window.scrollTo>) => {
  const firstArg = args[0] as ScrollToOptions | number | undefined
  const targetTop =
    typeof firstArg === 'object' && firstArg !== null ? firstArg.top : args[1]

  // Astro resets the viewport to the top during a normal page swap. When the
  // persisted navigation is already visible, that reset briefly moves the
  // navigation away from its old viewport position before our restoration
  // callback runs. Keep the current position until the swap is complete.
  if (pendingScroll !== null && targetTop === 0 && window.scrollY > 0) {
    return
  }

  // Astro resets the viewport to the top before restoring a traversed history
  // entry. Ignore that intermediate reset when the destination has a saved
  // position, so the back navigation never visibly travels through the top.
  if (scrollResetGuardY !== null && targetTop === 0 && scrollResetGuardY > 0) {
    return
  }

  // The document uses smooth scrolling for anchors. During a history
  // traversal, however, the restored position is state, not an interaction;
  // force Astro's numeric restore to land in one frame.
  if (traversalScrollBehavior !== null) {
    if (typeof firstArg === 'number') {
      nativeScrollTo({
        left: firstArg,
        top: typeof args[1] === 'number' ? args[1] : 0,
        behavior: 'instant',
      })
      return
    }
    if (typeof firstArg === 'object' && firstArg !== null) {
      nativeScrollTo({ ...firstArg, behavior: 'instant' })
      return
    }
  }

  nativeScrollTo(...args)
}) as typeof window.scrollTo

try {
  history.scrollRestoration = 'manual'
} catch {
  // Some embedded browsers expose history without scrollRestoration.
}

const syncNavigation = (
  targetPathname = location.pathname,
  animateIndicator = false,
) => {
  const pathname = targetPathname
  const containers = Array.from(
    document.querySelectorAll<HTMLElement>('[data-nav-container]'),
  )
  const indicators = createNavigationIndicatorController(containers)

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
    .querySelector('.section-nav')
    ?.classList.toggle('section-nav--adaptive', adaptive)

  if (animateIndicator) {
    indicators.read(pathname).forEach((state) => indicators.apply(state))
  } else {
    indicators.reposition(pathname)
  }
}

const setScrollPosition = (top: number) => {
  const root = document.documentElement
  const previousBehavior = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
  window.scrollTo(0, Math.max(0, top))
  root.style.scrollBehavior = previousBehavior
}

const isBlogDetailPath = (pathname: string) => {
  const normalizedPathname = pathname.endsWith('/') ? pathname : `${pathname}/`
  return (
    normalizedPathname.startsWith('/blog/') && normalizedPathname !== '/blog/'
  )
}

const getNavigationDocumentTop = (navigation: HTMLElement) => {
  // The profile immediately precedes the sticky navigation in normal flow.
  // Measure its bottom instead of temporarily disabling sticky positioning,
  // which can briefly drop the navigation's compositor layer on mobile.
  const profile = navigation.previousElementSibling
  if (profile?.classList.contains('profile-header')) {
    return profile.getBoundingClientRect().bottom + window.scrollY
  }
  return navigation.getBoundingClientRect().top + window.scrollY
}

const restorePendingScroll = () => {
  scrollFrame = null
  if (!pendingScroll) return

  const scroll = pendingScroll
  pendingScroll = null
  const navigation = document.querySelector<HTMLElement>('.section-nav')
  if (!navigation) return

  const nextTop = getNavigationDocumentTop(navigation) - scroll.viewportTop
  // This scroll restores the navigation's viewport position; it must not be
  // mistaken for a user's downward scroll that hides the navigation.
  previousNavigationScrollY = nextTop
  setScrollPosition(nextTop)
}

const schedulePendingScrollRestore = () => {
  if (scrollFrame !== null) cancelAnimationFrame(scrollFrame)
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = requestAnimationFrame(restorePendingScroll)
  })
}

const getPendingNavigationScroll = (
  navigation: HTMLElement | null,
  targetPathname: string,
  navigationType: string,
) => {
  if (
    navigationType === 'traverse' ||
    isBlogDetailPath(targetPathname) ||
    !navigation ||
    getComputedStyle(navigation).display === 'none'
  ) {
    return null
  }

  return {
    viewportTop: navigation.getBoundingClientRect().top,
  }
}

const setNavigationLoading = (loading: boolean) => {
  document
    .querySelector('main#main-content')
    ?.setAttribute('aria-busy', String(loading))
}

const captureScrollPosition = () => {
  if (scrollResetGuardY !== null || traversalScrollBehavior !== null) return

  const state = history.state
  if (!state || typeof state !== 'object') return

  try {
    history.replaceState(
      {
        ...state,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
      '',
    )
  } catch {
    // History can be unavailable in embedded or restricted browsers.
  }
}

const scheduleScrollPositionCapture = () => {
  if (historyScrollFrame !== null) return
  historyScrollFrame = requestAnimationFrame(() => {
    historyScrollFrame = null
    captureScrollPosition()
  })
}

const disableTraversalScrollAnimation = () => {
  if (traversalScrollBehavior !== null) return
  const root = document.documentElement
  traversalScrollBehavior = root.style.scrollBehavior
  root.style.scrollBehavior = 'auto'
}

const restoreTraversalScrollAnimation = () => {
  if (traversalScrollBehavior === null) return
  const root = document.documentElement
  root.style.scrollBehavior = traversalScrollBehavior
  traversalScrollBehavior = null
}

const scheduleTraversalScrollAnimationRestore = () => {
  if (traversalRestoreFrame !== null) {
    cancelAnimationFrame(traversalRestoreFrame)
  }

  // Keep `scroll-behavior: auto` through the first paint after Astro's
  // history restore. This prevents the browser from starting a smooth scroll
  // after the swap callback has already returned.
  traversalRestoreFrame = requestAnimationFrame(() => {
    traversalRestoreFrame = requestAnimationFrame(() => {
      traversalRestoreFrame = null
      scrollResetGuardY = null
      restoreTraversalScrollAnimation()
    })
  })
}

const setupNavigationFeedback = () => {
  if (navigationFeedbackInitialized) return
  navigationFeedbackInitialized = true

  document.addEventListener('astro:before-preparation', () =>
    setNavigationLoading(true),
  )
  document.addEventListener('astro:after-swap', () =>
    setNavigationLoading(false),
  )

  document.addEventListener('astro:before-swap', (event) => {
    const theme = readStoredTheme()
    event.newDocument.documentElement.classList.add('js')
    event.newDocument.documentElement.dataset.theme = theme
    event.newDocument.documentElement.style.colorScheme = theme
  })
}

const setNavigationHidden = (hidden: boolean) => {
  document
    .querySelector('.section-nav')
    ?.classList.toggle('section-nav--hidden', hidden)
}

const updateNavigationVisibility = () => {
  navigationVisibilityFrame = null
  const navigation = document.querySelector<HTMLElement>('.section-nav')
  if (!navigation) return

  const scrollY = window.scrollY
  const delta = scrollY - previousNavigationScrollY
  previousNavigationScrollY = scrollY

  if (scrollY <= 4) {
    setNavigationHidden(false)
    return
  }

  // Do not hide the navigation while it is still below the sticky edge.
  if (navigation.getBoundingClientRect().top > 1) return

  if (delta >= 8) setNavigationHidden(true)
  if (delta <= -8) setNavigationHidden(false)
}

const scheduleNavigationVisibility = () => {
  if (navigationVisibilityFrame !== null) return
  navigationVisibilityFrame = requestAnimationFrame(updateNavigationVisibility)
}

const setupNavigationVisibility = () => {
  if (navigationVisibilityInitialized) return
  navigationVisibilityInitialized = true
  previousNavigationScrollY = window.scrollY
  window.addEventListener('scroll', scheduleNavigationVisibility, {
    passive: true,
  })
  document.addEventListener('astro:after-swap', () => {
    previousNavigationScrollY = window.scrollY
    if (window.scrollY <= 4) setNavigationHidden(false)
  })
}

const swapPageKeepingNavigationInPlace = (newDocument: Document) => {
  const currentMain = document.querySelector<HTMLElement>('main#main-content')
  const nextMain = newDocument.querySelector<HTMLElement>('main#main-content')
  const currentNavigation = currentMain?.querySelector<HTMLElement>(
    ':scope > .section-nav',
  )
  const nextNavigation = nextMain?.querySelector<HTMLElement>(
    ':scope > .section-nav',
  )
  const currentProfile = currentMain?.querySelector<HTMLElement>(
    ':scope > .profile-header',
  )
  const nextProfile = nextMain?.querySelector<HTMLElement>(
    ':scope > .profile-header',
  )

  if (!currentMain || !nextMain || !currentNavigation || !nextNavigation) {
    return false
  }

  swapFunctions.deselectScripts(newDocument)
  swapFunctions.swapRootAttributes(newDocument)
  swapFunctions.swapHeadElements(newDocument)
  const restoreFocus = swapFunctions.saveFocus()

  currentMain.className = nextMain.className
  if (currentProfile && nextProfile) {
    currentProfile.className = nextProfile.className
  } else if (!currentProfile && nextProfile) {
    currentNavigation.before(document.importNode(nextProfile, true))
  } else if (currentProfile && !nextProfile) {
    currentProfile.remove()
  }

  // Keep the shared navigation shell connected so the indicator animation
  // continues while only the page content after it is replaced.
  while (currentNavigation.nextSibling) {
    currentMain.removeChild(currentNavigation.nextSibling)
  }
  const nextContent = document.createDocumentFragment()
  while (nextNavigation.nextSibling) {
    nextContent.append(nextNavigation.nextSibling)
  }
  currentNavigation.after(nextContent)

  restoreFocus()
  return true
}

export const setupSiteNavigation = () => {
  setupTheme()
  setupNavigationFeedback()
  setupNavigationVisibility()
}

syncNavigation()
setupSiteNavigation()

window.addEventListener(
  'popstate',
  () => {
    const savedY = history.state?.scrollY
    scrollResetGuardY = typeof savedY === 'number' && savedY > 0 ? savedY : null
    disableTraversalScrollAnimation()
  },
  { passive: true },
)

document.addEventListener('astro:before-swap', (event) => {
  const defaultSwap = event.swap
  event.swap = () => {
    if (!swapPageKeepingNavigationInPlace(event.newDocument)) defaultSwap()
  }
  pendingPathname = event.to.pathname
  pendingNavigationType = event.navigationType
  const navigation = document.querySelector<HTMLElement>('.section-nav')

  if (event.navigationType !== 'traverse') {
    setNavigationHidden(false)
    captureScrollPosition()
  }

  if (event.navigationType === 'traverse') {
    // Astro restores the destination history entry's saved scroll position.
    // Skip the page transition as well, so going back lands there immediately.
    pendingScroll = null
    const savedY = history.state?.scrollY
    scrollResetGuardY = typeof savedY === 'number' && savedY > 0 ? savedY : null
    disableTraversalScrollAnimation()
    event.viewTransition?.skipTransition()
  } else {
    pendingScroll = getPendingNavigationScroll(
      navigation,
      event.to.pathname,
      event.navigationType,
    )
  }
})

document.addEventListener('astro:after-swap', () => {
  const pathname = pendingPathname ?? location.pathname
  const navigationType = pendingNavigationType
  pendingPathname = null
  pendingNavigationType = null
  syncNavigation(pathname, navigationType !== 'traverse')
  if (navigationType !== 'traverse') setNavigationHidden(false)
  if (navigationType === 'traverse') scheduleTraversalScrollAnimationRestore()
})

document.addEventListener('astro:page-load', () => {
  if (pendingScroll) schedulePendingScrollRestore()
})

window.addEventListener('resize', () => syncNavigation(), { passive: true })
window.addEventListener('scroll', scheduleScrollPositionCapture, {
  passive: true,
})
