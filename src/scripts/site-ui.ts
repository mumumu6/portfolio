import {
  setNavigationLoading,
  setupSiteNavigation,
} from '@/scripts/site-navigation'
import { setupDisclosureAnimations } from '@/scripts/disclosure-animation'
import { setupImageLoading } from '@/scripts/image-loading'
import { syncResponsivePrefetch } from '@/scripts/responsive-prefetch'
import { registerServiceWorkerWhenIdle } from '@/scripts/service-worker'

const setupPage = () => {
  syncResponsivePrefetch()
  setNavigationLoading(false)
  setupSiteNavigation()
  setupImageLoading()
  setupDisclosureAnimations()
}

registerServiceWorkerWhenIdle()
setupPage()
document.addEventListener('astro:page-load', setupPage)
