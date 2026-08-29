const replyAnimations = new WeakMap<HTMLDetailsElement, Animation>();

const animateReplyDisclosure = (details: HTMLDetailsElement) => {
  const summary = details.querySelector<HTMLElement>(':scope > summary');
  if (!summary) return;

  const pendingTarget = details.dataset.targetOpen;
  const visuallyOpen = pendingTarget === undefined ? details.open : pendingTarget === 'true';
  const willOpen = !visuallyOpen;
  const startHeight = details.getBoundingClientRect().height;

  replyAnimations.get(details)?.cancel();
  details.dataset.targetOpen = String(willOpen);

  let endHeight: number;
  if (willOpen) {
    details.open = true;
    details.style.height = 'auto';
    endHeight = details.getBoundingClientRect().height;
  } else {
    endHeight = summary.getBoundingClientRect().height;
  }

  details.style.height = `${startHeight}px`;
  details.dataset.animating = 'true';
  const animation = details.animate(
    { height: [`${startHeight}px`, `${endHeight}px`] },
    { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
  replyAnimations.set(details, animation);

  animation.addEventListener('finish', () => {
    if (replyAnimations.get(details) !== animation) return;
    details.open = willOpen;
    details.style.removeProperty('height');
    delete details.dataset.animating;
    delete details.dataset.targetOpen;
    replyAnimations.delete(details);
  });
};

export const setupReplyDisclosure = () => {
  document.addEventListener('click', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!(event.target instanceof Element)) return;
    const summary = event.target.closest<HTMLElement>('.reply-disclosure > summary');
    const details = summary?.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    event.preventDefault();
    animateReplyDisclosure(details);
  });
};
