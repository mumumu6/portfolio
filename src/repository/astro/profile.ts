import { profile } from '@/collections/content/site/profile'
import type { ProfileRepository } from '@/repository/profile'

export const profileRepository: ProfileRepository = {
  getProfile: () => profile,
}
