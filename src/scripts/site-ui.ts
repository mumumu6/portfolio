import { setupSiteNavigation } from '@/scripts/site-navigation'
import { setupDisclosureAnimations } from '@/scripts/disclosure-animation'
import { setupImageLoading } from '@/scripts/image-loading'
import { registerServiceWorkerWhenIdle } from '@/scripts/service-worker'
import { syncResponsivePrefetch } from '@/scripts/responsive-prefetch'

const setupPage = () => {
  syncResponsivePrefetch()
  setupSiteNavigation()
  setupImageLoading()
  setupDisclosureAnimations()
}

registerServiceWorkerWhenIdle()
document.addEventListener('astro:page-load', setupPage)
