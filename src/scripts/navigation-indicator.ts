type IndicatorGeometry = {
  x: number
  width: number
}

export type IndicatorState = {
  indicator: HTMLElement | null
  origin: IndicatorGeometry | null
  target: IndicatorGeometry | null
}

const indicatorMinWidth = 36
const indicatorDuration = 200
const indicatorEasing = 'cubic-bezier(0.22, 1, 0.36, 1)'

const findLinkForPath = (nav: HTMLElement, pathname: string) =>
  Array.from(nav.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')).find(
    (link) => pathname === link.pathname || pathname.startsWith(link.pathname),
  )

const getTargetGeometry = (
  activeLink: HTMLAnchorElement,
): IndicatorGeometry => {
  const label = activeLink.querySelector<HTMLElement>(':scope > span')
  const availableWidth = Math.max(
    indicatorMinWidth,
    activeLink.offsetWidth - 16,
  )
  const labelWidth = label?.offsetWidth ?? availableWidth
  const width = Math.min(
    availableWidth,
    Math.max(indicatorMinWidth, labelWidth),
  )

  return {
    x: activeLink.offsetLeft + (activeLink.offsetWidth - width) / 2,
    width,
  }
}

const getCurrentGeometry = (
  nav: HTMLElement,
  indicator: HTMLElement | null,
): IndicatorGeometry | null => {
  if (!indicator || indicator.hidden || nav.getClientRects().length === 0)
    return null

  const navRect = nav.getBoundingClientRect()
  const indicatorRect = indicator.getBoundingClientRect()
  return {
    x: indicatorRect.left - navRect.left - nav.clientLeft,
    width: indicatorRect.width,
  }
}

export const createNavigationIndicatorController = (
  navContainers: HTMLElement[],
) => {
  let initialized = false

  const read = (targetPath: string): IndicatorState[] =>
    navContainers.map((nav) => {
      const indicator = nav.querySelector<HTMLElement>('[data-nav-indicator]')
      const targetLink = findLinkForPath(nav, targetPath)
      const origin = getCurrentGeometry(nav, indicator)
      const target =
        targetLink && nav.getClientRects().length > 0
          ? getTargetGeometry(targetLink)
          : null
      return { indicator, origin, target }
    })

  const apply = (state: IndicatorState, immediate = false) => {
    const { indicator, origin, target } = state
    if (!indicator || !target) {
      if (indicator && !indicator.hidden) indicator.hidden = true
      return
    }

    if (indicator.hidden) indicator.hidden = false
    indicator.getAnimations().forEach((animation) => animation.cancel())
    if (indicator.getAttribute('data-nav-ready') !== 'true')
      indicator.setAttribute('data-nav-ready', 'true')
    indicator.style.width = `${target.width}px`
    indicator.style.transform = `translate3d(${target.x}px, 0, 0)`

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (immediate || reducedMotion) return
    // Home has no active tab: slide into the first selection from outside the nav.
    const start =
      origin && origin.width > 0
        ? origin
        : { x: -target.width, width: target.width }

    indicator.animate(
      [
        {
          transform: `translate3d(${start.x}px, 0, 0) scaleX(${start.width / target.width})`,
        },
        { transform: `translate3d(${target.x}px, 0, 0) scaleX(1)` },
      ],
      {
        duration: indicatorDuration,
        easing: indicatorEasing,
      },
    )
  }

  const sync = (states: IndicatorState[], skipAnimation: boolean) => {
    if (!skipAnimation) {
      states.forEach((state) => apply(state, !initialized))
      initialized = true
    }
  }

  const hide = () => {
    navContainers.forEach((nav) => {
      const indicator = nav.querySelector<HTMLElement>('[data-nav-indicator]')
      if (indicator && !indicator.hidden) indicator.hidden = true
    })
  }

  const reposition = (pathname: string) => {
    read(pathname).forEach((state) => apply(state, true))
  }

  return { apply, hide, read, reposition, sync }
}
