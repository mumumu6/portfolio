import type { TransitionBeforeSwapEvent } from 'astro:transitions/client'

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const root = entry.target
      if (
        !(root instanceof HTMLElement) ||
        root.dataset.imageState !== 'loading'
      )
        continue
      root.dataset.imageInView = 'true'
      observer.unobserve(root)
    }
  },
  { rootMargin: '160px 0px' },
)

const settle = async (root: HTMLElement, image: HTMLImageElement) => {
  const token = String(Number(root.dataset.imageToken ?? '0') + 1)
  root.dataset.imageToken = token
  try {
    await image.decode()
  } catch {
    // decode() が失敗しても naturalWidth で表示可否を判定する。
  }
  if (root.dataset.imageToken !== token || !root.isConnected) return
  root.dataset.imageState = image.naturalWidth ? 'loaded' : 'error'
  observer.unobserve(root)
}

const fail = (root: HTMLElement) => {
  root.dataset.imageToken = String(Number(root.dataset.imageToken ?? '0') + 1)
  root.dataset.imageState = 'error'
  observer.unobserve(root)
}

const markLoaded = (root: HTMLElement, image: HTMLImageElement | null) => {
  if (!image?.complete || !image.naturalWidth) return false
  root.dataset.imageState = 'loaded'
  return true
}

const bind = (root: HTMLElement) => {
  if (root.dataset.imageBound === 'true') return
  const image = root.querySelector('img')
  if (!image) return
  root.dataset.imageBound = 'true'
  image.addEventListener('load', () => void settle(root, image))
  image.addEventListener('error', () => fail(root))
  if (markLoaded(root, image)) return
  if (image.complete) void settle(root, image)
  else if (root.dataset.imageState === 'loading') observer.observe(root)
}

const setup = (target: ParentNode = document) => {
  for (const root of target.querySelectorAll<HTMLElement>(
    '[data-optimized-image]',
  ))
    bind(root)
}

document.addEventListener('astro:before-swap', (event) => {
  const { newDocument } = event as TransitionBeforeSwapEvent
  for (const root of newDocument.querySelectorAll<HTMLElement>(
    '[data-optimized-image]',
  ))
    markLoaded(root, root.querySelector('img'))
})

document.addEventListener('astro:page-load', () => setup())
setup()
