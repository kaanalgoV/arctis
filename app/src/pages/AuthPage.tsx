import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Auth Page — Full-screen immersive OLED login
// Design: UI/UX Pro Max — Dark Mode OLED, Ice Blue accent, glass card
// ---------------------------------------------------------------------------

const PARTICLE_COUNT_DESKTOP = 22
const PARTICLE_COUNT_MOBILE = 10

function createParticles(count: number) {
  const particles: {
    left: string
    delay: string
    duration: string
    size: number
    opacity: number
    drift: number
  }[] = []
  // Use golden ratio for organic, non-repeating distribution
  const phi = 1.618033988749895
  for (let i = 0; i < count; i++) {
    const seed = ((i * phi) % 1)
    const seed2 = ((i * phi * phi) % 1)
    particles.push({
      left: `${(seed * 94 + 3).toFixed(1)}%`,
      delay: `${(seed2 * 12).toFixed(1)}s`,
      duration: `${14 + seed * 18}s`,
      size: 1 + seed2 * 2.5,
      opacity: 0.05 + seed * 0.12,
      drift: (i % 2 === 0 ? 1 : -1) * (5 + seed2 * 25),
    })
  }
  return particles
}

const PARTICLES_DESKTOP = createParticles(PARTICLE_COUNT_DESKTOP)
const PARTICLES_MOBILE = createParticles(PARTICLE_COUNT_MOBILE)

// ---------------------------------------------------------------------------
// Keyframe styles — injected once
// ---------------------------------------------------------------------------
const KEYFRAMES = `
  @keyframes authGlowPulse {
    0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.06); }
  }
  @keyframes authParticleRise {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    6%   { opacity: 1; }
    50%  { transform: translateY(-55vh) translateX(var(--drift, 15px)); opacity: 0.9; }
    94%  { opacity: 0.6; }
    100% { transform: translateY(-115vh) translateX(calc(var(--drift, 15px) * -0.5)); opacity: 0; }
  }
  @keyframes authScanLine {
    0%   { top: -2%; }
    100% { top: 102%; }
  }
  @keyframes authLogoPulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(92,184,240,0.25)); }
    50% { transform: scale(1.04); filter: drop-shadow(0 0 18px rgba(92,184,240,0.4)); }
  }
  @keyframes authCrystalBreathe {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  @keyframes authCrystalInnerPulse {
    0%, 100% { r: 3; opacity: 0.9; }
    50% { r: 3.5; opacity: 1; }
  }
  @keyframes authCrystalOuterRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes authCrystalSparkle {
    0%, 100% { opacity: 0; }
    50% { opacity: 0.8; }
  }
  @keyframes authMorphBlob1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(30px, -20px) scale(1.1); }
    50% { transform: translate(-20px, 15px) scale(0.9); }
    75% { transform: translate(15px, 25px) scale(1.05); }
  }
  @keyframes authMorphBlob2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-25px, 20px) scale(1.15); }
    66% { transform: translate(20px, -15px) scale(0.95); }
  }
  @keyframes authInputGlow {
    0%, 100% { box-shadow: 0 0 0 2px rgba(92,184,240,0.20); }
    50% { box-shadow: 0 0 8px 2px rgba(92,184,240,0.15), 0 0 0 2px rgba(92,184,240,0.25); }
  }
  @keyframes authShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* Placeholder */
  [data-auth-root] input::placeholder {
    color: #3D444D !important;
  }

  /* Focus ring utility */
  [data-auth-root] input:focus {
    border-color: #5CB8F0 !important;
    box-shadow: 0 0 0 2px rgba(92,184,240,0.20) !important;
    outline: none;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    [data-auth-root] *,
    [data-auth-root] *::before,
    [data-auth-root] *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function AuthPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const particles = useMemo(
    () => (isMobile ? PARTICLES_MOBILE : PARTICLES_DESKTOP),
    [isMobile],
  )

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      clearError()
      try {
        await login(email, password)
        navigate('/chart')
      } catch {
        // Error is surfaced via store
      }
    },
    [email, password, login, clearError, navigate],
  )

  const canSubmit = email.length > 0 && password.length >= 6

  return (
    <div
      data-auth-root=""
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: '#050709' }}
    >
      {/* Injected keyframes */}
      <style>{KEYFRAMES}</style>

      {/* ── BG LAYER 1a: Radial glow — center-top, 600x600, pulsing 8s ── */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          top: '-8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(92,184,240,0.06) 0%, rgba(92,184,240,0.02) 45%, transparent 70%)',
          animation: 'authGlowPulse 8s ease-in-out infinite',
        }}
      />

      {/* ── BG LAYER 1b: Second radial glow — bottom-right ── */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          bottom: '-12%',
          right: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(92,184,240,0.04) 0%, rgba(92,184,240,0.015) 40%, transparent 70%)',
          animation: 'authGlowPulse 10s ease-in-out 2s infinite',
        }}
      />

      {/* ── BG LAYER 1c: Third ambient glow — left-center, slower pulse ── */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          top: '30%',
          left: '-5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(92,184,240,0.03) 0%, rgba(92,184,240,0.01) 45%, transparent 70%)',
          animation: 'authGlowPulse 12s ease-in-out 4s infinite',
        }}
      />

      {/* ── BG LAYER: Vignette — edges darker than center ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* ── BG LAYER 2: Perspective grid fading to edges ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(rgba(92,184,240,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(92,184,240,0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage:
            'radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 60% 50% at 50% 50%, black 10%, transparent 70%)',
          perspective: '600px',
          transform: 'rotateX(35deg) scale(1.8)',
          transformOrigin: 'center 60%',
          opacity: 0.5,
        }}
      />

      {/* ── BG LAYER 3: Floating particles — 15 desktop / 8 mobile ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.left,
              bottom: '-5%',
              width: p.size,
              height: p.size,
              background: '#5CB8F0',
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 4}px rgba(92,184,240,0.3)`,
              animation: `authParticleRise ${p.duration} ${p.delay} linear infinite`,
              ['--drift' as string]: `${p.drift}px`,
            }}
          />
        ))}
      </div>

      {/* ── BG LAYER: Morphing gradient blobs — organic alive feeling ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute rounded-full"
          style={{
            top: '20%',
            left: '30%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(92,184,240,0.04) 0%, transparent 70%)',
            animation: 'authMorphBlob1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '10%',
            right: '20%',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(ellipse, rgba(92,184,240,0.03) 0%, transparent 70%)',
            animation: 'authMorphBlob2 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '50%',
            left: '60%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(52,211,153,0.02) 0%, transparent 70%)',
            animation: 'authMorphBlob1 30s ease-in-out 5s infinite',
          }}
        />
      </div>

      {/* ── BG LAYER 4: Horizontal scan line — 15s sweep ── */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        aria-hidden="true"
        style={{
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.10) 30%, rgba(92,184,240,0.16) 50%, rgba(92,184,240,0.10) 70%, transparent 100%)',
          animation: 'authScanLine 15s linear infinite',
          boxShadow: '0 0 16px rgba(92,184,240,0.06)',
        }}
      />

      {/* ── GLASS CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={mounted ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'relative z-10 w-full max-w-[420px]',
          'mx-4 lg:mx-0',
        )}
        style={{
          background: 'rgba(8, 11, 16, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(92,184,240,0.12)',
          boxShadow:
            '0 0 80px rgba(92,184,240,0.06), 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(92,184,240,0.08), inset 0 -1px 2px rgba(0,0,0,0.3)',
          borderRadius: '20px',
          padding: isMobile ? '32px 24px' : '48px 40px',
          transition: 'box-shadow 0.4s ease-out, border-color 0.4s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 0 100px rgba(92,184,240,0.10), 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(92,184,240,0.12), inset 0 -1px 2px rgba(0,0,0,0.3)'
          e.currentTarget.style.borderColor = 'rgba(92,184,240,0.18)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 0 80px rgba(92,184,240,0.06), 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(92,184,240,0.08), inset 0 -1px 2px rgba(0,0,0,0.3)'
          e.currentTarget.style.borderColor = 'rgba(92,184,240,0.12)'
        }}
      >
        {/* Horizontal gradient line above form — ice-blue to transparent */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0"
          style={{
            height: '1px',
            borderRadius: '20px 20px 0 0',
            background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.5) 30%, rgba(92,184,240,0.7) 50%, rgba(92,184,240,0.5) 70%, transparent 100%)',
          }}
        />
        {/* ── Logo + Brand ── */}
        <div className="flex flex-col items-center" style={{ paddingTop: '8px' }}>
          {/* Multi-layered crystal — 80px with rotation, pulse, sparkle */}
          <div className="relative" style={{ width: 80, height: 80 }}>
            {/* Layer 1: Outer ring — slow rotation 40s */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="absolute inset-0"
              style={{ animation: 'authCrystalOuterRotate 40s linear infinite' }}
            >
              <circle cx="40" cy="40" r="38" stroke="#5CB8F0" strokeWidth="0.4" fill="none" opacity="0.12" />
              <circle cx="40" cy="40" r="35" stroke="#5CB8F0" strokeWidth="0.3" fill="none" opacity="0.08" strokeDasharray="4 6" />
            </svg>

            {/* Layer 2: Inner crystal body — glow + breathe */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'authLogoPulse 5s ease-in-out infinite' }}
            >
              <svg
                width="56"
                height="56"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(92,184,240,0.3))',
                }}
              >
                {/* Inner rings — pulsing */}
                <circle cx="24" cy="24" r="20" stroke="#5CB8F0" strokeWidth="0.5" fill="none" opacity="0.15" style={{ animation: 'authCrystalBreathe 4s ease-in-out infinite' }} />
                <circle cx="24" cy="24" r="16" stroke="#5CB8F0" strokeWidth="0.8" fill="none" opacity="0.2" style={{ animation: 'authCrystalBreathe 4s ease-in-out 0.5s infinite' }} />
                {/* Main axes */}
                <line x1="24" y1="4" x2="24" y2="44" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <line x1="4" y1="24" x2="44" y2="24" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                {/* Diagonals */}
                <line x1="9.9" y1="9.9" x2="38.1" y2="38.1" stroke="#5CB8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
                <line x1="38.1" y1="9.9" x2="9.9" y2="38.1" stroke="#5CB8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
                {/* Inner ring */}
                <circle cx="24" cy="24" r="6" stroke="#5CB8F0" strokeWidth="0.8" fill="none" opacity="0.3" />
                {/* Center core — pulsing glow */}
                <circle cx="24" cy="24" r="3" fill="#5CB8F0" opacity="0.9" style={{ animation: 'authCrystalInnerPulse 3s ease-in-out infinite' }} />
                <circle cx="24" cy="24" r="1.2" fill="#fff" opacity="0.6" />
              </svg>
            </div>

            {/* Layer 3: Sparkle dots — fade in/out randomly */}
            {[
              { x: 4, y: 10, delay: 0 },
              { x: 72, y: 16, delay: 1.8 },
              { x: 8, y: 66, delay: 3.2 },
              { x: 68, y: 62, delay: 4.6 },
              { x: 38, y: 2, delay: 2.4 },
              { x: 40, y: 76, delay: 5.2 },
            ].map((spark, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: spark.x,
                  top: spark.y,
                  width: 2,
                  height: 2,
                  background: '#5CB8F0',
                  boxShadow: '0 0 4px rgba(92,184,240,0.8)',
                  animation: `authCrystalSparkle 3s ease-in-out ${spark.delay}s infinite`,
                }}
              />
            ))}
          </div>

          {/* Wordmark — 4px below logo */}
          <span
            className="font-semibold"
            style={{
              marginTop: '4px',
              fontSize: '14px',
              color: '#5CB8F0',
              letterSpacing: '0.25em',
            }}
          >
            ARCTIS
          </span>

          {/* Tagline — 2px below wordmark */}
          <span
            style={{
              marginTop: '2px',
              fontSize: '10px',
              color: '#3D444D',
              letterSpacing: '0.1em',
            }}
          >
            Trading Decision Support
          </span>
        </div>

        {/* 36px spacer */}
        <div style={{ height: '36px' }} />

        {/* ── Heading ── */}
        <h1 className="font-bold" style={{ fontSize: '22px', color: '#F0F6FC' }}>
          Willkommen zurueck.
        </h1>
        <p style={{ marginTop: '8px', fontSize: '13px', color: '#6E7681' }}>
          Melde dich an um dein Dashboard zu oeffnen.
        </p>

        {/* 28px spacer */}
        <div style={{ height: '28px' }} />

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                role="alert"
                className="mb-5"
              >
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs"
                  style={{
                    color: '#FF3B3B',
                    background: 'rgba(255, 59, 59, 0.06)',
                    border: '1px solid rgba(255, 59, 59, 0.12)',
                  }}
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email field */}
          <div>
            <label
              htmlFor="auth-email"
              className="block font-medium"
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6E7681',
                marginBottom: '6px',
              }}
            >
              E-Mail
            </label>
            <input
              id="auth-email"
              type="email"
              className="w-full h-12 px-3.5 rounded-xl text-[13px] transition-all duration-200"
              style={{
                background: 'rgba(22, 28, 38, 0.8)',
                border: '1px solid rgba(92,184,240,0.08)',
                color: '#F0F6FC',
              }}
              placeholder="name@beispiel.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          {/* 20px spacer */}
          <div style={{ height: '20px' }} />

          {/* Password field */}
          <div>
            <label
              htmlFor="auth-password"
              className="block font-medium"
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6E7681',
                marginBottom: '6px',
              }}
            >
              Passwort
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                className="w-full h-12 px-3.5 pr-10 rounded-xl text-[13px] transition-all duration-200"
                style={{
                  background: 'rgba(22, 28, 38, 0.8)',
                  border: '1px solid rgba(92,184,240,0.08)',
                  color: '#F0F6FC',
                }}
                placeholder="Min. 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-150 cursor-pointer hover:text-[#6E7681]"
                style={{ color: '#3D444D' }}
                aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 28px spacer */}
          <div style={{ height: '28px' }} />

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !canSubmit}
            className={cn(
              'w-full h-12 rounded-xl text-sm font-semibold relative overflow-hidden',
              'transition-all duration-200 flex items-center justify-center gap-2',
              'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer',
              'group',
              'hover:brightness-105 hover:-translate-y-px',
            )}
            style={{
              background: '#5CB8F0',
              color: '#0A0D12',
              boxShadow:
                '0 0 24px rgba(92,184,240,0.15), 0 4px 12px rgba(0,0,0,0.3)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && canSubmit) {
                e.currentTarget.style.boxShadow =
                  '0 0 40px rgba(92,184,240,0.30), 0 6px 20px rgba(0,0,0,0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow =
                '0 0 24px rgba(92,184,240,0.15), 0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {/* Shimmer overlay on hover */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ color: '#5CB8F0' }} />
                <span style={{ opacity: 0.5 }}>Anmelden...</span>
              </>
            ) : (
              <>
                Anmelden
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </>
            )}
          </button>

          {/* 12px spacer */}
          <div style={{ height: '12px' }} />

          {/* Forgot password */}
          <p className="text-center">
            <button
              type="button"
              className="transition-colors duration-150 cursor-pointer hover:text-[#5CB8F0]"
              style={{ fontSize: '11px', color: '#3D444D' }}
            >
              Passwort vergessen?
            </button>
          </p>
        </form>

        {/* 28px spacer */}
        <div style={{ height: '28px' }} />

        {/* ── Divider ── */}
        <div
          aria-hidden="true"
          style={{ height: '1px', background: 'rgba(92,184,240,0.06)' }}
        />

        {/* 16px spacer */}
        <div style={{ height: '16px' }} />

        {/* ── Trust line ── */}
        <p
          className="text-center"
          style={{ fontSize: '10px', color: '#3D444D' }}
        >
          Deine Daten bleiben lokal. Keine Trading-Daten auf externen Servern.
        </p>
      </motion.div>
    </div>
  )
}
