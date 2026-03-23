'use client'

import { motion, useScroll, useSpring } from 'framer-motion'

function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  })

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-ice"
      style={{
        scaleX: smoothProgress,
        transformOrigin: '0%',
      }}
    />
  )
}

export { ScrollProgress }
