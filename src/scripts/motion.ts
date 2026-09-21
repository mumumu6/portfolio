const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

// Read the live query so changes to the OS preference apply without a reload.
export const prefersReducedMotion = () => reducedMotionQuery.matches
