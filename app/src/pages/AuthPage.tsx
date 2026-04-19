import { useState, useEffect, useMemo, useCallback, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Eye, EyeOff, ArrowRight, Shield, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type PwStrength = 'none' | 'weak' | 'ok' | 'strong'

function evaluatePwStrength(pw: string): PwStrength {
  if (pw.length === 0) return 'none'
  const hasLower = /[a-z]/.test(pw)
  const hasUpper = /[A-Z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const mixedCase = hasLower && hasUpper
  if (pw.length >= 10 && mixedCase && hasDigit) return 'strong'
  if (pw.length >= 8 && mixedCase) return 'ok'
  if (pw.length >= 6) return 'weak'
  return 'none'
}

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
  @keyframes authShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes authFocusGlow {
    0%, 100% { box-shadow: 0 0 0 2px rgba(92,184,240,0.20); }
    50% { box-shadow: 0 0 8px 2px rgba(92,184,240,0.12), 0 0 0 2px rgba(92,184,240,0.25); }
  }
  @keyframes authErrorShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-3px); }
    75% { transform: translateX(3px); }
  }
  @keyframes authFadeIn200 {
    0% { opacity: 0; transform: translateY(-50%) scale(0.85); }
    100% { opacity: 1; transform: translateY(-50%) scale(1); }
  }
  @keyframes authSuccessPop {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes authLoadingShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  /* Placeholder */
  [data-auth-root] input::placeholder {
    color: rgba(110, 118, 129, 0.5) !important;
  }

  /* Focus ring */
  [data-auth-root] input:focus {
    border-color: rgba(92,184,240,0.35) !important;
    box-shadow: 0 0 0 3px rgba(92,184,240,0.10), 0 0 20px rgba(92,184,240,0.06) !important;
    outline: none;
    background: rgba(22, 28, 38, 1) !important;
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
  const [success, setSuccess] = useState(false)

  const emailInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-focus email input on error for accessibility
  useEffect(() => {
    if (error) {
      emailInputRef.current?.focus()
    }
  }, [error])

  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email])
  const pwStrength = useMemo(() => evaluatePwStrength(password), [password])

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
        // Micro-delight: briefly flash a green checkmark before navigating
        setSuccess(true)
        await new Promise((resolve) => setTimeout(resolve, 400))
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

      {/* ── BG LAYER 1a: Radial glow — center-top ── */}
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

      {/* ── BG LAYER 1c: Third ambient glow ── */}
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

      {/* ── BG: Vignette ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* ── BG: Perspective grid ── */}
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

      {/* ── BG: Floating particles ── */}
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

      {/* ── BG: Morphing blobs ── */}
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
      </div>

      {/* ── BG: Scan line ── */}
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
        initial={{ opacity: 0, y: 24 }}
        animate={mounted ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'relative z-10 w-full max-w-[440px]',
          'mx-4 lg:mx-0',
        )}
        style={{
          background: 'rgba(8, 11, 16, 0.85)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(92,184,240,0.10)',
          boxShadow:
            '0 0 80px rgba(92,184,240,0.05), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
          borderRadius: '24px',
          padding: isMobile ? '36px 24px 32px' : '52px 44px 44px',
          transition: 'box-shadow 0.4s ease-out, border-color 0.4s ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            '0 0 100px rgba(92,184,240,0.08), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
          e.currentTarget.style.borderColor = 'rgba(92,184,240,0.16)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            '0 0 80px rgba(92,184,240,0.05), 0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)'
          e.currentTarget.style.borderColor = 'rgba(92,184,240,0.10)'
        }}
      >
        {/* Top accent line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-6 top-0"
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.4) 30%, rgba(92,184,240,0.6) 50%, rgba(92,184,240,0.4) 70%, transparent 100%)',
          }}
        />

        {/* ── Logo + Brand ── */}
        <div className="flex flex-col items-center" style={{ paddingTop: '4px' }}>
          {/* Multi-layered crystal */}
          <div className="relative" style={{ width: 72, height: 72 }}>
            {/* Outer ring */}
            <svg
              width="72"
              height="72"
              viewBox="0 0 72 72"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="absolute inset-0"
              style={{ animation: 'authCrystalOuterRotate 40s linear infinite' }}
            >
              <circle cx="36" cy="36" r="34" stroke="#5CB8F0" strokeWidth="0.4" fill="none" opacity="0.12" />
              <circle cx="36" cy="36" r="31" stroke="#5CB8F0" strokeWidth="0.3" fill="none" opacity="0.08" strokeDasharray="4 6" />
            </svg>

            {/* Inner crystal */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: 'authLogoPulse 5s ease-in-out infinite' }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(92,184,240,0.3))',
                }}
              >
                <circle cx="24" cy="24" r="20" stroke="#5CB8F0" strokeWidth="0.5" fill="none" opacity="0.15" style={{ animation: 'authCrystalBreathe 4s ease-in-out infinite' }} />
                <circle cx="24" cy="24" r="16" stroke="#5CB8F0" strokeWidth="0.8" fill="none" opacity="0.2" style={{ animation: 'authCrystalBreathe 4s ease-in-out 0.5s infinite' }} />
                <line x1="24" y1="4" x2="24" y2="44" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <line x1="4" y1="24" x2="44" y2="24" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <line x1="9.9" y1="9.9" x2="38.1" y2="38.1" stroke="#5CB8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
                <line x1="38.1" y1="9.9" x2="9.9" y2="38.1" stroke="#5CB8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
                <circle cx="24" cy="24" r="6" stroke="#5CB8F0" strokeWidth="0.8" fill="none" opacity="0.3" />
                <circle cx="24" cy="24" r="3" fill="#5CB8F0" opacity="0.9" style={{ animation: 'authCrystalInnerPulse 3s ease-in-out infinite' }} />
                <circle cx="24" cy="24" r="1.2" fill="#fff" opacity="0.6" />
              </svg>
            </div>

            {/* Sparkles */}
            {[
              { x: 4, y: 10, delay: 0 },
              { x: 64, y: 14, delay: 1.8 },
              { x: 6, y: 58, delay: 3.2 },
              { x: 62, y: 56, delay: 4.6 },
              { x: 34, y: 2, delay: 2.4 },
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

          {/* Wordmark */}
          <span
            className="font-semibold"
            style={{
              marginTop: '8px',
              fontSize: '13px',
              color: '#5CB8F0',
              letterSpacing: '0.3em',
            }}
          >
            ARCTIS
          </span>

          {/* Tagline */}
          <span
            style={{
              marginTop: '3px',
              fontSize: '10px',
              color: 'rgba(110, 118, 129, 0.6)',
              letterSpacing: '0.12em',
            }}
          >
            Precision Trading Analysis
          </span>
        </div>

        {/* Spacer */}
        <div style={{ height: '40px' }} />

        {/* ── Heading ── */}
        <h1
          className="font-bold"
          style={{ fontSize: '24px', color: '#F0F6FC', letterSpacing: '-0.01em' }}
        >
          Willkommen zur&uuml;ck.
        </h1>
        <p style={{ marginTop: '8px', fontSize: '13.5px', color: '#6E7681', lineHeight: '1.5' }}>
          Melde dich an, um dein Dashboard zu &ouml;ffnen.
        </p>

        {/* Spacer */}
        <div style={{ height: '32px' }} />

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
                id="auth-error"
                className="mb-5"
                style={{ animation: 'authErrorShake 0.35s ease-in-out' }}
              >
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs"
                  style={{
                    color: '#F87171',
                    background: 'rgba(248, 113, 113, 0.06)',
                    border: '1px solid rgba(248, 113, 113, 0.12)',
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
                letterSpacing: '0.1em',
                color: '#6E7681',
                marginBottom: '8px',
              }}
            >
              E-Mail
            </label>
            <div className="relative">
              <input
                ref={emailInputRef}
                id="auth-email"
                type="email"
                className="w-full h-[48px] px-4 pr-11 rounded-xl text-[13px] transition-all duration-200"
                style={{
                  background: 'rgba(22, 28, 38, 0.7)',
                  border: '1px solid rgba(92,184,240,0.08)',
                  color: '#F0F6FC',
                }}
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                aria-describedby={error ? 'auth-error' : undefined}
                aria-invalid={error ? true : undefined}
              />
              {emailValid && (
                <CheckCircle2
                  size={16}
                  aria-hidden="true"
                  className="absolute right-4 top-1/2 pointer-events-none"
                  style={{
                    color: '#34D399',
                    animation: 'authFadeIn200 200ms ease-out forwards',
                  }}
                />
              )}
            </div>
          </div>

          {/* Spacer */}
          <div style={{ height: '20px' }} />

          {/* Password field */}
          <div>
            <label
              htmlFor="auth-password"
              className="block font-medium"
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#6E7681',
                marginBottom: '8px',
              }}
            >
              Passwort
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPw ? 'text' : 'password'}
                className="w-full h-[48px] px-4 pr-11 rounded-xl text-[13px] transition-all duration-200"
                style={{
                  background: 'rgba(22, 28, 38, 0.7)',
                  border: '1px solid rgba(92,184,240,0.08)',
                  color: '#F0F6FC',
                }}
                placeholder="Mindestens 6 Zeichen"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                aria-describedby={error ? 'auth-error' : undefined}
                aria-invalid={error ? true : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150 cursor-pointer"
                style={{ color: 'rgba(110, 118, 129, 0.5)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#5CB8F0' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(110, 118, 129, 0.5)' }}
                aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                aria-pressed={showPw}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password strength indicator */}
            {pwStrength !== 'none' && (() => {
              const strengthMap = {
                weak:   { label: 'Schwach', color: 'rgba(248, 113, 113, 0.75)', segments: 1 },
                ok:     { label: 'Okay',    color: 'rgba(251, 191, 36, 0.85)',  segments: 2 },
                strong: { label: 'Stark',   color: '#34D399',                   segments: 3 },
              } as const
              const info = strengthMap[pwStrength]
              const mutedColor = 'rgba(110, 118, 129, 0.18)'
              return (
                <div style={{ marginTop: '10px' }} aria-live="polite">
                  <div
                    style={{
                      fontSize: '10px',
                      color: info.color,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      marginBottom: '6px',
                      transition: 'color 200ms ease-out',
                    }}
                  >
                    {info.label}
                  </div>
                  <div className="flex gap-1" role="progressbar" aria-valuenow={info.segments} aria-valuemin={0} aria-valuemax={3} aria-label="Passwort-Stärke">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-full rounded-full"
                        style={{
                          height: '3px',
                          background: i < info.segments ? info.color : mutedColor,
                          transition: 'background 250ms ease-out',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Spacer */}
          <div style={{ height: '32px' }} />

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !canSubmit || success}
            aria-busy={isLoading}
            className={cn(
              'w-full h-[50px] rounded-xl text-[13.5px] font-semibold relative overflow-hidden',
              'transition-all duration-250 flex items-center justify-center gap-2',
              'disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer',
              'group',
            )}
            style={{
              background: canSubmit
                ? 'linear-gradient(135deg, #5CB8F0 0%, #4AA3DB 100%)'
                : '#5CB8F0',
              color: '#050709',
              boxShadow: canSubmit
                ? '0 0 28px rgba(92,184,240,0.18), 0 4px 16px rgba(0,0,0,0.4)'
                : 'none',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              if (!isLoading && canSubmit) {
                e.currentTarget.style.boxShadow =
                  '0 0 48px rgba(92,184,240,0.28), 0 8px 24px rgba(0,0,0,0.5)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = canSubmit
                ? '0 0 28px rgba(92,184,240,0.18), 0 4px 16px rgba(0,0,0,0.4)'
                : 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {/* Shimmer — hover trigger */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />

            {/* Shimmer — continuous loading sweep */}
            {isLoading && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                  animation: 'authLoadingShimmer 1.2s linear infinite',
                }}
              />
            )}

            {success ? (
              <CheckCircle2
                size={20}
                aria-hidden="true"
                className="absolute left-1/2 top-1/2"
                style={{
                  color: '#34D399',
                  animation: 'authSuccessPop 250ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                }}
              />
            ) : isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin relative z-10" />
                <span style={{ opacity: 0.75 }} className="relative z-10">Anmelden...</span>
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

          {/* Spacer */}
          <div style={{ height: '16px' }} />

          {/* Auxiliary links — forgot password & signup */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="transition-colors duration-200 cursor-pointer"
              style={{ fontSize: '12px', color: 'rgba(110, 118, 129, 0.6)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#5CB8F0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(110, 118, 129, 0.6)' }}
            >
              Passwort vergessen?
            </button>
            <a
              href="/checkout"
              className="transition-colors duration-200 cursor-pointer inline-flex items-center"
              style={{ fontSize: '12px', color: 'rgba(92,184,240,0.7)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#5CB8F0' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(92,184,240,0.7)' }}
            >
              Noch kein Account?{' '}
              <span
                className="relative ml-1 after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-[#5CB8F0] after:transition-all after:duration-300 hover:after:w-full"
              >
                Jetzt starten
              </span>
            </a>
          </div>
        </form>

        {/* Spacer */}
        <div style={{ height: '32px' }} />

        {/* ── Trust section ── */}
        <div
          aria-hidden="true"
          style={{ height: '1px', background: 'rgba(255,255,255,0.04)' }}
        />
        <div style={{ height: '20px' }} />

        <div className="flex items-center justify-center gap-2">
          <Shield size={12} style={{ color: 'rgba(92,184,240,0.35)' }} />
          <p style={{ fontSize: '11px', color: 'rgba(110, 118, 129, 0.45)', letterSpacing: '0.01em' }}>
            Deine Daten bleiben lokal. Keine Handelsdaten auf externen Servern.
          </p>
        </div>

        {/* Trust badges */}
        <div style={{ height: '12px' }} />
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {['256-bit SSL', 'Lokale Daten', 'Keine Tracker'].map((label) => (
            <span
              key={label}
              className="font-mono"
              style={{
                fontSize: '9.5px',
                letterSpacing: '0.08em',
                color: 'rgba(110, 118, 129, 0.55)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(92,184,240,0.08)',
                background: 'rgba(22, 28, 38, 0.35)',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
