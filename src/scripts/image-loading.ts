const selector = '.responsive-image[data-image-state]'

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
}

const fail = (root: HTMLElement) => {
  root.dataset.imageToken = String(Number(root.dataset.imageToken ?? '0') + 1)
  root.dataset.imageState = 'error'
}

const bind = (root: HTMLElement) => {
  if (root.dataset.imageBound === 'true') return
  const image = root.querySelector('img')
  if (!image) return
  root.dataset.imageBound = 'true'
  image.addEventListener('load', () => void settle(root, image))
  image.addEventListener('error', () => fail(root))
  if (image.complete) void settle(root, image)
}

const setup = (target: ParentNode = document) => {
  for (const root of target.querySelectorAll<HTMLElement>(selector)) bind(root)
}

document.addEventListener('astro:page-load', () => setup())
setup()
