import type { TimelineEntry } from '@/repository/experience'

export const thoughtsPerPage = 20

export const paginateThoughts = (
  thoughts: TimelineEntry[],
  pageSize: number,
): TimelineEntry[][] => {
  const pages: TimelineEntry[][] = []

  for (let offset = 0; offset < thoughts.length; offset += pageSize) {
    pages.push(thoughts.slice(offset, offset + pageSize))
  }

  return pages
}
