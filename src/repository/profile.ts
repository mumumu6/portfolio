export type SiteProfile = {
  name: string
  bio: string
  affiliations: string[]
  links: Array<{
    label: string
    icon: 'github' | 'x'
    href: string
  }>
}

export interface ProfileRepository {
  getProfile(): SiteProfile
}
