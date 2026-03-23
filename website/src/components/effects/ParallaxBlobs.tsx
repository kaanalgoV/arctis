'use client'

import { motion, useScroll, useTransform } from 'framer-motion'

export function ParallaxBlobs() {
  const { scrollY } = useScroll()

  const blob1Y = useTransform(scrollY, [0, 1000], [0, -50])
  const blob2Y = useTransform(scrollY, [0, 1000], [0, -80])
  const blob3Y = useTransform(scrollY, [0, 1000], [0, -60])

  return (
    <>
      {/* Blob 1 — top-left, speed 0.05 */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: '8%',
          left: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,174,216,0.04) 0%, transparent 70%)',
          zIndex: 0,
          y: blob1Y,
        }}
      />

      {/* Blob 2 — center-right, speed 0.08 */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: '35%',
          right: '8%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,174,216,0.03) 0%, transparent 70%)',
          zIndex: 0,
          y: blob2Y,
        }}
      />

      {/* Blob 3 — bottom-left, speed 0.06 */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: '15%',
          left: '12%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(90,174,216,0.035) 0%, transparent 70%)',
          zIndex: 0,
          y: blob3Y,
        }}
      />
    </>
  )
}
