import { prefetch } from 'astro:prefetch'
import type { TransitionBeforeSwapEvent } from 'astro:transitions/client'
import { applyTheme } from '@/lib/theme'

// ページ全体の処理は、遷移で維持されるナビのハイドレーションに依存させない。
const imageObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    const image = entry.target as HTMLImageElement
    const top = entry.boundingClientRect.top + window.scrollY
    if (entry.isIntersecting && top <= window.innerHeight)
      image.loading = 'eager'
    else if (entry.boundingClientRect.height > 0 && top > window.innerHeight)
      image.loading = 'lazy'
    observer.unobserve(image)
  }
})
const syncImages = () => {
  imageObserver.disconnect()
  for (const image of document.images) {
    if (!image.closest('astro-island[ssr], details:not([open])'))
      imageObserver.observe(image)
  }
}
let imageFrame: number | undefined
window.addEventListener('resize', () => {
  if (imageFrame !== undefined) return
  imageFrame = requestAnimationFrame(() => {
    imageFrame = undefined
    syncImages()
  })
})
document.addEventListener('astro:page-load', syncImages)
syncImages()

// PC のホバー先読みは Astro に任せ、タッチ操作だけ標準 API に渡す。
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
