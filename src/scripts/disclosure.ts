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

const durationOf = (content: HTMLElement, name: string, fallback: number) => {
  const value = getComputedStyle(content).getPropertyValue(name).trim()
  if (value.endsWith('ms')) return Number.parseFloat(value)
  if (value.endsWith('s')) return Number.parseFloat(value) * 1000
  return fallback
}

const cancelMotion = (content: HTMLElement) => {
  for (const animation of content.getAnimations()) animation.cancel()
}

const resetMotion = (content: HTMLElement) => {
  cancelMotion(content)
  content.style.height = ''
  content.style.opacity = ''
  content.style.transform = ''
}

const closedTransform = 'translateY(-5px) scaleY(0.99)'
const openTransform = 'translateY(0px) scaleY(1)'

const play = (
  root: HTMLElement,
  content: HTMLElement,
  token: string,
  from: { height: string; opacity: number; transform: string },
  to: { height: string; opacity: number; transform: string },
  done?: () => void,
) => {
  cancelMotion(content)
  if (reducedMotion()) {
    resetMotion(content)
    done?.()
    return
  }
  const height = content.animate(
    [{ height: from.height }, { height: to.height }],
    {
      duration: durationOf(content, '--disclosure-duration', 420),
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  )
  content.animate(
    [{ transform: from.transform }, { transform: to.transform }],
    {
      duration: durationOf(content, '--disclosure-duration', 420),
      easing: 'cubic-bezier(0.16, 1.06, 0.3, 1)',
      fill: 'forwards',
    },
  )
  content.animate([{ opacity: from.opacity }, { opacity: to.opacity }], {
    duration: durationOf(content, '--disclosure-opacity-duration', 220),
    easing: 'ease-out',
    fill: 'forwards',
  })
  const finish = () => {
    if (root.dataset.disclosureToken !== token) return
    resetMotion(content)
    done?.()
  }
  void height.finished.then(finish, finish)
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
    content.style.opacity = '0'
    content.style.transform = closedTransform
    const height = content.scrollHeight
    play(
      root,
      content,
      token,
      { height: '0px', opacity: 0, transform: closedTransform },
      { height: `${height}px`, opacity: 1, transform: openTransform },
    )
    return
  }

  const height = Math.ceil(content.getBoundingClientRect().height)
  play(
    root,
    content,
    token,
    { height: `${height}px`, opacity: 1, transform: openTransform },
    { height: '0px', opacity: 0, transform: closedTransform },
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
