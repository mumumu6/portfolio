import { prefersReducedMotion } from '@/scripts/motion'

const boundDisclosures = new WeakSet<HTMLDetailsElement>()

export const setupDisclosureAnimations = () => {
  document
    .querySelectorAll<HTMLDetailsElement>('details')
    .forEach((details) => {
      if (boundDisclosures.has(details)) return
      const content = details.querySelector<HTMLElement>(
        '[data-disclosure-content]',
      )
      const summary = details.querySelector<HTMLElement>(':scope > summary')
      if (!content || !summary) return

      boundDisclosures.add(details)
      let animationFrame = 0
      let finishTimer = 0
      let isClosing = false
      let closeTransitionStarted = false

      const clearPendingAnimation = () => {
        cancelAnimationFrame(animationFrame)
        window.clearTimeout(finishTimer)
      }

      const setExpandedHeight = () => {
        content.style.maxHeight = `${content.scrollHeight}px`
      }

      const measureExpandedHeight = () => {
        const previousTransition = content.style.transition
        const previousMaxHeight = content.style.maxHeight
        content.style.transition = 'none'
        content.style.maxHeight = 'none'
        const expandedHeight = content.scrollHeight
        content.style.maxHeight = previousMaxHeight
        void content.offsetHeight
        content.style.transition = previousTransition
        return expandedHeight
      }

      const finishClose = () => {
        window.clearTimeout(finishTimer)
        isClosing = false
        closeTransitionStarted = false
        details.open = false
        details.removeAttribute('data-closing')
        content.classList.remove('is-open')
        content.style.maxHeight = '0px'
      }

      const finishOpen = () => {
        window.clearTimeout(finishTimer)
        if (details.open && !isClosing) content.style.maxHeight = 'none'
      }

      const openDisclosure = (animate = true) => {
        clearPendingAnimation()
        isClosing = false
        closeTransitionStarted = false
        details.removeAttribute('data-closing')
        details.open = true

        if (!animate || prefersReducedMotion()) {
          content.classList.add('is-open')
          content.style.maxHeight = 'none'
          return
        }

        content.style.maxHeight = '0px'
        void content.offsetHeight
        animationFrame = requestAnimationFrame(() => {
          if (!details.open) return
          content.classList.add('is-open')
          const expandedHeight = measureExpandedHeight()
          animationFrame = requestAnimationFrame(() => {
            if (details.open) {
              content.style.maxHeight = `${expandedHeight}px`
              finishTimer = window.setTimeout(finishOpen, 480)
            }
          })
        })
      }

      const closeDisclosure = () => {
        clearPendingAnimation()
        isClosing = true
        closeTransitionStarted = false
        details.dataset.closing = 'true'

        if (prefersReducedMotion()) {
          finishClose()
          return
        }

        content.classList.add('is-measuring')
        setExpandedHeight()
        void content.offsetHeight
        content.classList.remove('is-open')
        void content.offsetHeight
        content.classList.remove('is-measuring')
        animationFrame = requestAnimationFrame(() => {
          closeTransitionStarted = true
          content.style.maxHeight = '0px'
        })
        finishTimer = window.setTimeout(finishClose, 480)
      }

      summary.addEventListener('click', (event) => {
        event.preventDefault()
        if (details.open && !isClosing) closeDisclosure()
        else openDisclosure()
      })

      content.addEventListener('transitionend', (event) => {
        if (event.target !== content) return
        if (event.propertyName !== 'max-height') return
        if (isClosing && closeTransitionStarted) {
          finishClose()
        } else if (!isClosing) {
          finishOpen()
        }
      })

      if (details.open) openDisclosure(false)
      else content.style.maxHeight = '0px'
    })
}
