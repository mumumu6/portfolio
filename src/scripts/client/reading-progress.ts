let article: HTMLElement | null = null
let start = 0
let end = 1
let headings: { id: string; top: number }[] = []
let frame = 0
let lastProgress = -1
let lastPercent = -1
let lastHeading: string | null = null
let resizeObserver: ResizeObserver | undefined

const controls = () =>
  document.querySelector<HTMLElement>('[data-article-controls]')

const measure = () => {
  const root = controls()
  const id = root?.dataset.articleId
  const next = id ? document.getElementById(id) : null
  if (!next) {
    article = null
    return
  }
  article = next
  const scrollY = window.scrollY
  start = next.getBoundingClientRect().top + scrollY
  end = Math.max(start + next.offsetHeight - window.innerHeight, start + 1)
  headings = Array.from(
    next.querySelectorAll<HTMLElement>('.article-prose h2, .article-prose h3'),
    (heading) => ({
      id: heading.id,
      top: heading.getBoundingClientRect().top + scrollY,
    }),
  )
}

const render = () => {
  frame = 0
  if (!article?.isConnected) return
  const y = window.scrollY
  const distance = end - start
  const progress =
    y <= start
      ? 0
      : distance <= 1 || y >= end - 1
        ? 100
        : Math.max(0, Math.min(100, ((y - start) / distance) * 100))
  const percent = Math.floor(progress)
  const current =
    headings.findLast((heading) => heading.top <= y + 150)?.id ?? null

  if (Math.abs(progress - lastProgress) >= 0.1 || percent !== lastPercent) {
    lastProgress = progress
    lastPercent = percent
    const label = `${percent}%`
    for (const node of document.querySelectorAll(
      '[data-reading-progress-label]',
    ))
      node.textContent = label
    for (const ring of document.querySelectorAll<HTMLElement>(
      '[data-reading-progress-ring]',
    )) {
      ring.style.strokeDasharray = progress === 100 ? 'none' : '100'
      ring.style.strokeDashoffset = String(100 - progress)
    }
  }

  if (current === lastHeading) return
  lastHeading = current
  for (const link of document.querySelectorAll<HTMLAnchorElement>(
    '[data-toc-link]',
  )) {
    const active = link.dataset.headingId === current
    link.classList.toggle('active', active)
    if (active) link.setAttribute('aria-current', 'location')
    else link.removeAttribute('aria-current')
  }
}

const schedule = () => {
  if (frame || !article) return
  frame = requestAnimationFrame(render)
}

const bind = () => {
  resizeObserver?.disconnect()
  lastProgress = -1
  lastPercent = -1
  lastHeading = null
  measure()
  if (!article) return
  resizeObserver = new ResizeObserver(() => {
    measure()
    render()
  })
  resizeObserver.observe(article)
  render()
  void document.fonts.ready.then(() => {
    measure()
    render()
  })
}

window.addEventListener('scroll', schedule, { passive: true })
window.addEventListener(
  'resize',
  () => {
    measure()
    schedule()
  },
  { passive: true },
)
window.addEventListener('pageshow', () => {
  measure()
  render()
})
document.addEventListener('astro:page-load', bind)
document.fonts.addEventListener('loadingdone', () => {
  measure()
  render()
})
bind()

export {}
