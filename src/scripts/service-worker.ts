export const registerServiceWorkerWhenIdle = () => {
  const register = () => {
    import('virtual:pwa-register').then(({ registerSW }) => registerSW())
  }

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      // Start after the document is interactive, rather than waiting for
      // every eager image to finish loading. This lets the next navigation
      // become SW-controlled sooner on slow networks.
      window.requestIdleCallback(register, { timeout: 1200 })
    } else {
      globalThis.setTimeout(register, 1200)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true })
  } else {
    schedule()
  }
}
