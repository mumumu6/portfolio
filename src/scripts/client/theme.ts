export type Theme = 'light' | 'dark'

export const applyTheme = (theme: Theme, target: Document = document) => {
  const root = target.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
  target
    .querySelector('[data-theme-color]')
    ?.setAttribute('content', theme === 'dark' ? '#090d12' : '#eef1f4')
}
