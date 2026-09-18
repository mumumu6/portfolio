import { setupSiteNavigation } from '@/scripts/site-navigation'
import { setupDisclosureAnimations } from '@/scripts/disclosure-animation'
import { setupImageLoading } from '@/scripts/image-loading'
import { registerServiceWorkerWhenIdle } from '@/scripts/service-worker'
import { syncResponsivePrefetch } from '@/scripts/responsive-prefetch'

let readingProgressModule: Promise<
  typeof import('@/scripts/reading-progress')
> | null = null

const setupReadingProgressForPage = async () => {
  if (!document.querySelector('.article-page') && !readingProgressModule) return

  readingProgressModule ??= import('@/scripts/reading-progress')
  const { setupReadingProgress } = await readingProgressModule
  setupReadingProgress()
}

const setupPage = () => {
  syncResponsivePrefetch()
  setupSiteNavigation()
  setupImageLoading()
  setupDisclosureAnimations()
  setupReadingProgressForPage()
}

registerServiceWorkerWhenIdle()
document.addEventListener('astro:page-load', setupPage)
