let article: HTMLElement | null = null
let headings: { id: string; top: number }[] = []
let frame = 0
let lastHeading: string | null = null
let resizeObserver: ResizeObserver | undefined

const controls = () =>
  document.querySelector<HTMLElement>('[data-article-controls]')

const measure = () => {
  const root = controls()
  const id = root?.dataset.articleId
  const next = id ? document.querySelector<HTMLElement>(`#${id}`) : null
  if (!next) {
    article = null
    return
  }
  article = next
  const scrollY = window.scrollY
  headings = Array.from(
    next.querySelectorAll<HTMLElement>(
      '[data-article-prose] h2, [data-article-prose] h3',
    ),
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
  const current =
    headings.findLast((heading) => heading.top <= y + 150)?.id ?? null

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

export const initializeReadingProgress = bind

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
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('[data-scroll-to-top]')) return
  window.scrollTo({ top: 0, behavior: 'auto' })
})
bind()
