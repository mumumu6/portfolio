export type NavigationItem = {
  href: string
  label: string
}

export const navigationItems: NavigationItem[] = [
  { href: '/works/', label: 'Works' },
  { href: '/blog/', label: 'Blog' },
  { href: '/experience/', label: 'Experience' },
  { href: '/thoughts/', label: 'Thoughts' },
]

export const matchesNavigationPath = (pathname: string, linkPath: string) =>
  pathname === linkPath || pathname.startsWith(linkPath)

export const isNavigationItemActive = (pathname: string, href: string) =>
  matchesNavigationPath(pathname, href)
