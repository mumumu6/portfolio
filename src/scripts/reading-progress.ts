let cleanupReadingProgress: (() => void) | null = null

export const setupReadingProgress = () => {
  cleanupReadingProgress?.()
  cleanupReadingProgress = null

  const article = document.querySelector<HTMLElement>('.article-page')
  const progressRing = document.querySelector<HTMLElement>(
    '[data-reading-progress]',
  )
  const progressRingValue = document.querySelector<SVGCircleElement>(
    '[data-reading-progress-ring]',
  )

  if (!article || !progressRing || !progressRingValue) return

  let active = true
  let progressFrame = 0
  let measurementFrame = 0
  let progressStart = 0
  let progressEnd = 1
  let previousProgressValue = -1
  let previousProgressPercent = -1
  let previousHeadingId: string | null | undefined
  let progressLabels: HTMLElement[] = []
  let progressHeadings: { id: string; top: number }[] = []
  let progressLinks: HTMLAnchorElement[] = []

  const scheduleReadingProgress = () => {
    if (!active || progressFrame) return
    progressFrame = requestAnimationFrame(updateReadingProgress)
  }

  const measureReadingProgress = () => {
    measurementFrame = 0
    if (!active) return

    progressLabels = [
      ...document.querySelectorAll<HTMLElement>(
        '[data-reading-progress-label]',
      ),
    ]
    progressLinks = [
      ...document.querySelectorAll<HTMLAnchorElement>('.article-toc a'),
    ]

    const articleRect = article.getBoundingClientRect()
    progressStart = articleRect.top + window.scrollY
    progressEnd = Math.max(
      progressStart + articleRect.height - window.innerHeight,
      progressStart + 1,
    )
    progressHeadings = [
      ...article.querySelectorAll<HTMLElement>(
        '.article-prose h2, .article-prose h3',
      ),
    ].map((heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top + window.scrollY,
    }))
    previousProgressValue = -1
    previousProgressPercent = -1
    previousHeadingId = undefined
    scheduleReadingProgress()
  }

  const scheduleReadingProgressMeasurement = () => {
    if (!active || measurementFrame) return
    measurementFrame = requestAnimationFrame(measureReadingProgress)
  }

  const updateReadingProgress = () => {
    progressFrame = 0
    if (!active) return

    const scrollY = window.scrollY
    const progress =
      scrollY >= progressEnd - 1
        ? 1
        : Math.min(
            1,
            Math.max(
              0,
              (scrollY - progressStart) / (progressEnd - progressStart),
            ),
          )
    const progressValue = progress * 100
    const progressPercent = progress === 1 ? 100 : Math.floor(progressValue)
    let currentHeadingId: string | null = null
    for (let index = progressHeadings.length - 1; index >= 0; index -= 1) {
      const heading = progressHeadings[index]
      if (heading && heading.top <= scrollY + 150) {
        currentHeadingId = heading.id
        break
      }
    }

    if (progressValue !== previousProgressValue) {
      previousProgressValue = progressValue
      progressRingValue.style.strokeDasharray =
        progressValue === 100 ? 'none' : '100'
      progressRingValue.style.strokeDashoffset = `${100 - progressValue}`
    }

    if (progressPercent !== previousProgressPercent) {
      previousProgressPercent = progressPercent
      progressLabels.forEach((label) => {
        label.textContent = `${progressPercent}%`
      })
    }

    if (currentHeadingId !== previousHeadingId) {
      previousHeadingId = currentHeadingId
      progressLinks.forEach((link) => {
        const activeLink = currentHeadingId
          ? link.hash === `#${encodeURIComponent(currentHeadingId)}`
          : false
        link.classList.toggle('active', activeLink)
        if (activeLink) link.setAttribute('aria-current', 'location')
        else link.removeAttribute('aria-current')
      })
    }
  }

  const handleTocClick = (event: MouseEvent) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }

    const clicked = event.target
    if (!(clicked instanceof Element)) return
    const link = clicked.closest<HTMLAnchorElement>(
      '.article-toc a, .article-toc-mobile a',
    )
    if (
      !link ||
      !link.hash ||
      link.origin !== location.origin ||
      link.pathname !== location.pathname
    ) {
      return
    }

    const heading = document.getElementById(
      decodeURIComponent(link.hash.slice(1)),
    )
    if (!heading) return

    event.preventDefault()
    history.pushState({ ...history.state }, '', `${link.pathname}${link.hash}`)
    const navigation = document.querySelector<HTMLElement>('.section-nav')
    const navigationOffset =
      (navigation?.getBoundingClientRect().height ?? 0) + 16
    const targetTop =
      heading.getBoundingClientRect().top + window.scrollY - navigationOffset

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
    link.closest('details')?.removeAttribute('open')
  }

  const cleanup = () => {
    active = false
    if (progressFrame) cancelAnimationFrame(progressFrame)
    if (measurementFrame) cancelAnimationFrame(measurementFrame)
    window.removeEventListener('scroll', scheduleReadingProgress)
    window.removeEventListener('resize', scheduleReadingProgressMeasurement)
    document.removeEventListener('click', handleTocClick, { capture: true })
  }

  cleanupReadingProgress = cleanup
  window.addEventListener('scroll', scheduleReadingProgress, { passive: true })
  window.addEventListener('resize', scheduleReadingProgressMeasurement)
  document.addEventListener('click', handleTocClick, { capture: true })
  document.fonts.ready.then(() => {
    if (active) scheduleReadingProgressMeasurement()
  })
  scheduleReadingProgressMeasurement()
}
