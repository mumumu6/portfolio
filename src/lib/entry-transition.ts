export const entryTransitionName = (href: string, part: 'title' | 'image') =>
  `entry-${encodeURIComponent(href).replaceAll('%', '_')}-${part}`
