'use client'

import { useMemo } from 'react'

interface Particle {
  id: number
  size: number
  top: number
  left: number
  delay: number
  duration: number
  driftX: number
  driftY: number
  driftR: number
  opacity: number
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

export function FrostParticles() {
  const particles = useMemo<Particle[]>(() => {
    const rand = seededRandom(0xa4c71c5)
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      size: 2 + rand() * 2,
      top: rand() * 100,
      left: rand() * 100,
      delay: rand() * 8,
      duration: 13 + rand() * 15.6,
      driftX: (rand() - 0.5) * 120,
      driftY: -(60 + rand() * 160),
      driftR: (rand() - 0.5) * 360,
      opacity: 0.05 + rand() * 0.2,
    }))
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={
            {
              width: p.size,
              height: p.size,
              top: `${p.top}%`,
              left: `${p.left}%`,
              background: `rgba(92, 184, 240, ${p.opacity})`,
              animationName: 'frost-drift',
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationFillMode: 'both',
              '--drift-x': `${p.driftX}px`,
              '--drift-y': `${p.driftY}px`,
              '--drift-r': `${p.driftR}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
