import { applyTheme, type Theme } from '@/lib/theme'

const label = (dark: boolean) =>
  dark ? 'ライトテーマに切り替える' : 'ダークテーマに切り替える'

const syncThemeToggle = () => {
  const dark = document.documentElement.dataset.theme !== 'light'
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-theme-toggle]',
  )) {
    button.setAttribute('aria-pressed', String(dark))
    button.setAttribute('aria-label', label(dark))
  }
}

const toggleTheme = () => {
  const root = document.documentElement
  if (root.hasAttribute('data-theme-transitioning')) return
  const theme: Theme = root.dataset.theme === 'light' ? 'dark' : 'light'
  const apply = () => {
    applyTheme(theme)
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // ストレージが利用できない環境では保存を省略する。
    }
    syncThemeToggle()
  }
  if (
    matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !document.startViewTransition
  ) {
    apply()
    return
  }
  root.setAttribute('data-theme-transitioning', '')
  const transition = document.startViewTransition(apply)
  const finish = () => root.removeAttribute('data-theme-transitioning')
  void transition.ready.catch(() => {})
  void transition.finished.then(finish, finish)
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return
  if (!event.target.closest('[data-theme-toggle]')) return
  toggleTheme()
})

document.addEventListener('astro:page-load', syncThemeToggle)
syncThemeToggle()
