const reducedMotion = () =>
  matchMedia('(prefers-reduced-motion: reduce)').matches

const contentOf = (root: HTMLElement) =>
  root.querySelector<HTMLElement>(':scope > .disclosure-content')

const triggerOf = (root: HTMLElement) =>
  root.querySelector<HTMLButtonElement>(':scope > .disclosure-trigger')

const nextToken = (root: HTMLElement) => {
  const token = String(Number(root.dataset.disclosureToken ?? '0') + 1)
  root.dataset.disclosureToken = token
  return token
}

const durationOf = (content: HTMLElement) => {
  const value = getComputedStyle(content)
    .getPropertyValue('--disclosure-duration')
    .trim()
  if (value.endsWith('ms')) return Number.parseFloat(value)
  if (value.endsWith('s')) return Number.parseFloat(value) * 1000
  return 420
}

const cancelMotion = (content: HTMLElement) => {
  for (const animation of content.getAnimations()) animation.cancel()
}

const resetMotion = (content: HTMLElement) => {
  cancelMotion(content)
  content.style.height = ''
  content.style.opacity = ''
}

const play = (
  root: HTMLElement,
  content: HTMLElement,
  token: string,
  frames: Keyframe[],
  done?: () => void,
) => {
  cancelMotion(content)
  if (reducedMotion()) {
    resetMotion(content)
    done?.()
    return
  }
  const animation = content.animate(frames, {
    duration: durationOf(content),
    easing: 'ease-out',
    fill: 'forwards',
  })
  const finish = () => {
    if (root.dataset.disclosureToken !== token) return
    resetMotion(content)
    done?.()
  }
  void animation.finished.then(finish, finish)
}

const setOpen = (root: HTMLElement, open: boolean) => {
  const content = contentOf(root)
  const trigger = triggerOf(root)
  if (!content || !trigger) return
  const token = nextToken(root)
  trigger.setAttribute('aria-expanded', String(open))
  root.dataset.state = open ? 'open' : 'closed'
  content.dataset.state = root.dataset.state

  if (open) {
    content.hidden = false
    content.style.height = '0px'
    const height = content.scrollHeight
    content.style.opacity = '0'
    play(root, content, token, [
      { height: '0px', opacity: 0 },
      { height: `${height}px`, opacity: 1 },
    ])
    return
  }

  const height = Math.ceil(content.getBoundingClientRect().height)
  play(
    root,
    content,
    token,
    [
      { height: `${height}px`, opacity: 1 },
      { height: '0px', opacity: 0 },
    ],
    () => {
      content.hidden = true
    },
  )
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  const trigger = event.target.closest<HTMLButtonElement>('.disclosure-trigger')
  const root = trigger?.closest<HTMLElement>('[data-disclosure]')
  if (!trigger || !root || trigger !== triggerOf(root)) return
  setOpen(root, root.dataset.state !== 'open')
})

document.addEventListener('click', (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !(event.target instanceof Element)
  )
    return
  const link = event.target.closest('a[data-toc-link]')
  const root = link?.closest<HTMLElement>('[data-disclosure]')
  if (!link || !root) return
  setOpen(root, false)
})
