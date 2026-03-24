export const transitions = {
  springStiff: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springGentle: { type: 'spring' as const, stiffness: 300, damping: 25 },
  easeOut: { duration: 0.15, ease: 'easeOut' as const },
  easeOutSlow: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export const fadeIn = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: transitions.easeOut,
}

export const slideInRight = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: transitions.springGentle,
}
