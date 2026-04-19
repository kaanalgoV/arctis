import { useState, useCallback, useMemo, useEffect, useRef, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, AlertCircle, Copy, CheckCircle2, Lock, Shield, Sparkles, LogIn, Mail, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/store/settings'

// ---------------------------------------------------------------------------
// Checkout Page — Full-screen immersive OLED checkout
// Design: Arctic Frost theme, glassmorphism, matching AuthPage style
// ---------------------------------------------------------------------------

type BillingPlan = 'monthly' | 'annual'
type PaymentMethod = 'sepa' | 'credit_card'

interface FormData {
  firstName: string
  lastName: string
  email: string
  // SEPA
  iban: string
  accountHolder: string
  sepaConsent: boolean
  // Credit card
  cardNumber: string
  cardExpiry: string
  cardCvv: string
  cardHolder: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  iban?: string
  accountHolder?: string
  sepaConsent?: string
  cardNumber?: string
  cardExpiry?: string
  cardCvv?: string
  cardHolder?: string
}

interface SuccessData {
  subId: string
  name: string
  loginEmail: string
  loginPassword: string
  nextBillingDate: string
  planPrice: string
}

// ---------------------------------------------------------------------------
// IBAN formatting
// ---------------------------------------------------------------------------

function formatIBAN(value: string): string {
  const clean = value.replace(/\s/g, '').toUpperCase()
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

function cleanIBAN(value: string): string {
  return value.replace(/\s/g, '').toUpperCase()
}

// ---------------------------------------------------------------------------
// Credit card formatting
// ---------------------------------------------------------------------------

function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 16)
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

function formatCardExpiry(value: string): string {
  const clean = value.replace(/\D/g, '').slice(0, 4)
  if (clean.length >= 3) {
    return clean.slice(0, 2) + '/' + clean.slice(2)
  }
  return clean
}

// ---------------------------------------------------------------------------
// Card brand detection
// ---------------------------------------------------------------------------

function detectCardBrand(cardNumber: string): 'visa' | 'mastercard' | 'amex' | null {
  const digits = cardNumber.replace(/\D/g, '')
  if (!digits) return null
  const first = digits[0]
  if (first === '4') return 'visa'
  if (first === '5') return 'mastercard'
  if (first === '3') return 'amex'
  return null
}

const CARD_BRAND_LABEL: Record<'visa' | 'mastercard' | 'amex', string> = {
  visa: 'VISA',
  mastercard: 'MASTERCARD',
  amex: 'AMEX',
}

// ---------------------------------------------------------------------------
// Email validation
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isEmailValid(email: string): boolean {
  return EMAIL_RE.test(email.trim())
}

// ---------------------------------------------------------------------------
// Keyframes
// ---------------------------------------------------------------------------

const KEYFRAMES = `
  @keyframes checkoutGlowPulse {
    0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
    50% { opacity: 1; transform: translateX(-50%) scale(1.06); }
  }
  @keyframes checkoutParticleRise {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateY(-110vh) translateX(15px); opacity: 0; }
  }
  @keyframes checkoutScanLine {
    0%   { top: -2%; }
    100% { top: 102%; }
  }
  @keyframes checkoutLogoPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }
  @keyframes checkoutSuccessPop {
    0% { transform: scale(0.8); opacity: 0; }
    60% { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes checkoutDrawCheck {
    from { stroke-dashoffset: 36; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes checkoutCircleDraw {
    from { stroke-dashoffset: 157; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes checkoutSuccessRing {
    0% { transform: scale(0.6); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  @keyframes checkoutConfetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(-120px) rotate(360deg); opacity: 0; }
  }
  @keyframes checkoutSuccessGlow {
    0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.3); }
    50% { box-shadow: 0 0 30px 8px rgba(52, 211, 153, 0.15); }
    100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
  }
  @keyframes checkoutTyping {
    from { width: 0; }
    to { width: 100%; }
  }
  @keyframes checkoutPulseGlow {
    0%, 100% { box-shadow: 0 0 16px rgba(92,184,240,0.15); }
    50% { box-shadow: 0 0 24px rgba(92,184,240,0.25); }
  }
  @keyframes checkoutShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes checkoutStepReveal {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes checkoutShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes checkoutBadgePulseOnce {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(92,184,240,0.4); }
    50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(92,184,240,0); }
  }
  @keyframes checkoutStepBorderPulse {
    0% { box-shadow: 0 0 0 0 rgba(92,184,240,0.55); }
    100% { box-shadow: 0 0 0 8px rgba(92,184,240,0); }
  }
  @keyframes checkoutSubmitSweep {
    0%   { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }
  @keyframes checkoutFadeIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }

  [data-checkout-root] input::placeholder {
    color: #3D444D !important;
  }

  [data-checkout-root] input:focus {
    border-color: #5CB8F0 !important;
    box-shadow: 0 0 0 2px rgba(92,184,240,0.20) !important;
    outline: none;
  }

  [data-checkout-root] input[data-error="true"] {
    border-color: rgba(248, 113, 113, 0.40) !important;
  }

  [data-checkout-root] input[data-error="true"]:focus {
    border-color: rgba(248, 113, 113, 0.60) !important;
    box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.20) !important;
  }

  [data-checkout-root] [data-shake="true"] {
    animation: checkoutShake 0.4s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    [data-checkout-root] *,
    [data-checkout-root] *::before,
    [data-checkout-root] *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  delay: `${(i * 1.7) % 8}s`,
  duration: `${15 + (i * 3.1) % 10}s`,
  size: 2 + (i % 2),
  opacity: 0.12 + (i % 4) * 0.05,
}))

// ---------------------------------------------------------------------------
// Plan info
// ---------------------------------------------------------------------------

const PLAN_INFO = {
  monthly: { label: '49€/Monat', total: '49€/Monat', interval: 'Monatlich' },
  annual: { label: '39€/Monat (jährlich)', total: '468€/Jahr (spare 120€)', interval: 'Jährlich' },
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CheckoutPage() {
  const engineUrl = useSettingsStore((s) => s.engineUrl)

  const [plan, setPlan] = useState<BillingPlan>('annual')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sepa')
  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    iban: '',
    accountHolder: '',
    sepaConsent: false,
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolder: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<SuccessData | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
    const mq = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Read plan from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const p = params.get('plan')
    if (p === 'monthly' || p === 'annual') setPlan(p)
  }, [])

  const updateField = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setGlobalError('')
  }, [])

  const handleIBANChange = useCallback((raw: string) => {
    const formatted = formatIBAN(raw)
    if (cleanIBAN(formatted).length <= 34) {
      updateField('iban', formatted)
    }
  }, [updateField])

  const handleCardNumberChange = useCallback((raw: string) => {
    updateField('cardNumber', formatCardNumber(raw))
  }, [updateField])

  const handleCardExpiryChange = useCallback((raw: string) => {
    updateField('cardExpiry', formatCardExpiry(raw))
  }, [updateField])

  const handleCardCvvChange = useCallback((raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 3)
    updateField('cardCvv', clean)
  }, [updateField])

  const handleCopyPassword = useCallback(() => {
    if (success?.loginPassword) {
      navigator.clipboard.writeText(success.loginPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [success])

  const validate = useCallback((): boolean => {
    const e: FormErrors = {}
    if (!form.firstName.trim()) e.firstName = 'Vorname ist erforderlich'
    if (!form.lastName.trim()) e.lastName = 'Nachname ist erforderlich'
    if (!form.email.trim()) e.email = 'E-Mail ist erforderlich'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Ungültige E-Mail-Adresse'

    if (paymentMethod === 'sepa') {
      const rawIban = cleanIBAN(form.iban)
      if (!rawIban) e.iban = 'IBAN ist erforderlich'
      else if (rawIban.length < 15) e.iban = 'IBAN ist zu kurz'
      if (!form.accountHolder.trim()) e.accountHolder = 'Kontoinhaber ist erforderlich'
      if (!form.sepaConsent) e.sepaConsent = 'SEPA-Einzugsermächtigung ist erforderlich'
    } else {
      const cardClean = form.cardNumber.replace(/\s/g, '')
      if (!cardClean) e.cardNumber = 'Kartennummer ist erforderlich'
      else if (cardClean.length < 13) e.cardNumber = 'Kartennummer ist zu kurz'
      if (!form.cardExpiry) e.cardExpiry = 'Ablaufdatum ist erforderlich'
      else if (form.cardExpiry.length < 5) e.cardExpiry = 'Format: MM/YY'
      if (!form.cardCvv) e.cardCvv = 'CVV ist erforderlich'
      else if (form.cardCvv.length < 3) e.cardCvv = 'CVV: 3 Ziffern'
      if (!form.cardHolder.trim()) e.cardHolder = 'Karteninhaber ist erforderlich'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }, [form, paymentMethod])

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    if (!validate()) return

    setIsLoading(true)
    try {
      const body: Record<string, unknown> = {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        plan,
        payment_method: paymentMethod,
      }

      if (paymentMethod === 'sepa') {
        body.iban = cleanIBAN(form.iban)
        body.account_holder = form.accountHolder.trim()
        body.sepa_consent = form.sepaConsent
      } else {
        body.card_number = form.cardNumber.replace(/\s/g, '')
        body.card_expiry = form.cardExpiry
        body.card_cvv = form.cardCvv
        body.card_holder = form.cardHolder.trim()
      }

      const res = await fetch(`${engineUrl}/api/checkout/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: 'Unbekannter Fehler' }))
        throw new Error(data.detail || `Fehler ${res.status}`)
      }

      const data = await res.json()
      setSuccess({
        subId: data.subscription_id,
        name: form.firstName,
        loginEmail: data.login_email,
        loginPassword: data.login_password,
        nextBillingDate: data.next_billing_date,
        planPrice: data.plan_price,
      })
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Verbindungsfehler')
    } finally {
      setIsLoading(false)
    }
  }, [form, plan, paymentMethod, validate, engineUrl])

  const planInfo = useMemo(() => PLAN_INFO[plan], [plan])

  // --- Stepper progression -------------------------------------------------
  // 1 Plan (always done once plan chosen — plan has default, so always ≥ step 2)
  // 2 Daten (firstName + lastName + valid email)
  // 3 Zahlung (valid payment inputs for selected method)
  // 4 Fertig (after success)
  const currentStep = useMemo(() => {
    if (success) return 4
    const dataDone =
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      isEmailValid(form.email)
    if (!dataDone) return 2
    const paymentDone =
      paymentMethod === 'sepa'
        ? cleanIBAN(form.iban).length >= 15 &&
          form.accountHolder.trim().length > 0 &&
          form.sepaConsent
        : form.cardNumber.replace(/\s/g, '').length >= 13 &&
          form.cardExpiry.length >= 5 &&
          form.cardCvv.length >= 3 &&
          form.cardHolder.trim().length > 0
    return paymentDone ? 4 : 3
  }, [success, form, paymentMethod])

  // One-shot border pulse on current step when it changes
  const prevStepRef = useRef(currentStep)
  const [pulsedStep, setPulsedStep] = useState<number | null>(null)
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      setPulsedStep(currentStep)
      prevStepRef.current = currentStep
      const t = setTimeout(() => setPulsedStep(null), 800)
      return () => clearTimeout(t)
    }
  }, [currentStep])

  // Error shake: trigger once when errors become non-empty
  const [shakeKey, setShakeKey] = useState(0)
  const prevErrCountRef = useRef(0)
  useEffect(() => {
    const count = Object.values(errors).filter(Boolean).length
    if (count > prevErrCountRef.current) {
      setShakeKey((k) => k + 1)
    }
    prevErrCountRef.current = count
  }, [errors])

  // Card brand detection
  const cardBrand = useMemo(() => detectCardBrand(form.cardNumber), [form.cardNumber])
  // IBAN DE badge trigger
  const ibanIsDE = useMemo(() => {
    const clean = cleanIBAN(form.iban)
    return clean.length >= 2 && clean.startsWith('DE')
  }, [form.iban])
  // Email validity
  const emailValid = useMemo(() => isEmailValid(form.email), [form.email])

  const nextBilling = useMemo(() => {
    const d = new Date()
    if (plan === 'annual') d.setFullYear(d.getFullYear() + 1)
    else d.setMonth(d.getMonth() + 1)
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }, [plan])

  // --- Render ---

  return (
    <div
      data-checkout-root=""
      className="min-h-screen w-full flex items-start justify-center relative overflow-y-auto py-12"
      style={{ background: '#050709' }}
    >
      <style>{KEYFRAMES}</style>

      {/* BG: Radial glow — top center */}
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
          animation: 'checkoutGlowPulse 8s ease-in-out infinite',
        }}
      />

      {/* BG: Second radial glow — bottom right */}
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
          animation: 'checkoutGlowPulse 10s ease-in-out 2s infinite',
        }}
      />

      {/* BG: Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* BG: Grid */}
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

      {/* BG: Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {PARTICLES.map((p, i) => (
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
              boxShadow: `0 0 ${p.size * 3}px rgba(92,184,240,0.25)`,
              animation: `checkoutParticleRise ${p.duration} ${p.delay} linear infinite`,
            }}
          />
        ))}
      </div>

      {/* BG: Scan line */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        aria-hidden="true"
        style={{
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.10) 30%, rgba(92,184,240,0.16) 50%, rgba(92,184,240,0.10) 70%, transparent 100%)',
          animation: 'checkoutScanLine 15s linear infinite',
          boxShadow: '0 0 16px rgba(92,184,240,0.06)',
        }}
      />

      {/* --- GLASS CARD --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={mounted ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn('relative z-10 w-full max-w-[520px]', 'mx-4 lg:mx-0')}
        style={{
          background: 'rgba(8, 11, 16, 0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(92,184,240,0.12)',
          boxShadow:
            '0 0 80px rgba(92,184,240,0.06), 0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(92,184,240,0.08)',
          borderRadius: '20px',
          padding: isMobile ? '32px 24px' : '48px 40px',
        }}
      >
        {/* Gradient line at top */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0"
          style={{
            height: '1px',
            borderRadius: '20px 20px 0 0',
            background: 'linear-gradient(90deg, transparent 0%, rgba(92,184,240,0.5) 30%, rgba(92,184,240,0.7) 50%, rgba(92,184,240,0.5) 70%, transparent 100%)',
          }}
        />

        {/* --- Progress Indicator --- */}
        {!success && (
          <div className="mb-6" aria-label="Checkout Fortschritt">
            <div className="flex items-center justify-between">
              {[
                { num: 1, label: 'Plan' },
                { num: 2, label: 'Daten' },
                { num: 3, label: 'Zahlung' },
                { num: 4, label: 'Fertig' },
              ].map((step, i) => {
                const completed = step.num < currentStep
                const active = step.num === currentStep
                const visible = completed || active
                const connectorFill = Math.max(
                  0,
                  Math.min(1, (currentStep - step.num)),
                )
                return (
                  <div
                    key={step.num}
                    className="flex items-center"
                    style={{ flex: i < 3 ? 1 : 'none' }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="flex items-center justify-center rounded-full transition-all duration-300"
                        style={{
                          width: 24,
                          height: 24,
                          fontSize: '10px',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          background: completed
                            ? 'rgba(52,211,153,0.15)'
                            : active
                              ? 'rgba(92,184,240,0.18)'
                              : 'rgba(92,184,240,0.06)',
                          color: completed
                            ? '#34D399'
                            : active
                              ? '#5CB8F0'
                              : '#3D444D',
                          border: `1px solid ${completed ? 'rgba(52,211,153,0.35)' : active ? 'rgba(92,184,240,0.45)' : 'rgba(92,184,240,0.08)'}`,
                          animation: pulsedStep === step.num && active
                            ? 'checkoutStepBorderPulse 0.8s ease-out'
                            : undefined,
                        }}
                        aria-current={active ? 'step' : undefined}
                      >
                        {completed ? (
                          <CheckCircle2
                            size={14}
                            style={{
                              color: '#34D399',
                              animation: 'checkoutFadeIn 0.25s ease-out',
                            }}
                          />
                        ) : (
                          step.num
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '9px',
                          color: visible ? (completed ? '#34D399' : '#5CB8F0') : '#3D444D',
                          transition: 'color 0.3s ease',
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className="flex-1 mx-2 relative"
                        style={{
                          height: 1,
                          background: 'rgba(92,184,240,0.06)',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={false}
                          animate={{ scaleX: connectorFill }}
                          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            transformOrigin: 'left center',
                            background:
                              'linear-gradient(90deg, rgba(52,211,153,0.6) 0%, rgba(92,184,240,0.5) 100%)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* --- Success State --- */}
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center"
              style={{ padding: '32px 0' }}
            >
              {/* Celebration icon — larger with ring burst */}
              <div className="relative">
                {/* Expanding ring burst */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    width: 88,
                    height: 88,
                    border: '2px solid rgba(52, 211, 153, 0.3)',
                    animation: 'checkoutSuccessRing 1.2s ease-out 0.3s both',
                  }}
                />
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 88,
                    height: 88,
                    background: 'rgba(52, 211, 153, 0.12)',
                    animation: 'checkoutSuccessPop 0.5s ease-out, checkoutSuccessGlow 1.5s ease-out 0.8s both',
                  }}
                >
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
                    <circle
                      cx="22" cy="22" r="19"
                      stroke="#34D399"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="120"
                      style={{
                        animation:
                          'checkoutCircleDraw 0.7s cubic-bezier(0.65,0,0.35,1) 0.1s both',
                      }}
                    />
                    <polyline
                      points="14,23 19,28 30,16"
                      stroke="#34D399"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      strokeDasharray="36"
                      style={{
                        animation:
                          'checkoutDrawCheck 0.5s cubic-bezier(0.65,0,0.35,1) 0.7s both',
                      }}
                    />
                  </svg>
                </div>
                {/* Confetti particles — 10 particles */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => {
                  const colors = ['#34D399', '#5CB8F0', '#FBBF24', '#34D399', '#5CB8F0', '#A78BFA', '#34D399', '#5CB8F0', '#FBBF24', '#34D399']
                  const sizes = [4, 3, 5, 3, 4, 3, 5, 3, 4, 3]
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        width: sizes[i],
                        height: sizes[i],
                        borderRadius: i % 3 === 0 ? '50%' : '1px',
                        background: colors[i],
                        top: '50%',
                        left: '50%',
                        transform: `rotate(${i * 36}deg) translateY(-${45 + (i % 3) * 10}px)`,
                        animation: `checkoutConfetti ${0.8 + (i % 3) * 0.3}s ease-out ${0.3 + i * 0.06}s both`,
                      }}
                    />
                  )
                })}
              </div>

              <div style={{ height: '28px' }} />

              <h2 className="font-bold" style={{ fontSize: '26px', color: '#F0F6FC' }}>
                Willkommen bei Arctis!
              </h2>
              <p style={{ marginTop: '10px', fontSize: '14px', color: '#949DA8' }}>
                Dein Account ist bereit. Los geht's.
              </p>

              <div style={{ height: '20px' }} />

              {/* Credentials box */}
              <div
                className="w-full rounded-xl px-4 py-4"
                style={{
                  background: 'rgba(22, 28, 38, 0.8)',
                  border: '1px solid rgba(92,184,240,0.08)',
                }}
              >
                <div className="flex justify-between items-center" style={{ fontSize: '12px', color: '#6E7681' }}>
                  <span>E-Mail</span>
                  <span style={{ color: '#F0F6FC', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    {success.loginEmail}
                  </span>
                </div>

                <div style={{ height: '1px', background: 'rgba(92,184,240,0.06)', margin: '10px 0' }} />

                <div className="flex justify-between items-center" style={{ fontSize: '12px', color: '#6E7681' }}>
                  <span>Passwort</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#F0F6FC', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {success.loginPassword}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1 rounded transition-colors hover:bg-white/5 cursor-pointer"
                      title="Passwort kopieren"
                    >
                      {copied ? (
                        <CheckCircle2 size={14} style={{ color: '#34D399' }} />
                      ) : (
                        <Copy size={14} style={{ color: '#6E7681' }} />
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(92,184,240,0.06)', margin: '10px 0' }} />

                <div className="flex justify-between" style={{ fontSize: '12px', color: '#6E7681' }}>
                  <span>Nächste Abbuchung</span>
                  <span style={{ color: '#F0F6FC', fontFamily: 'var(--font-mono)' }}>
                    {success.nextBillingDate}
                  </span>
                </div>

                <div style={{ height: '1px', background: 'rgba(92,184,240,0.06)', margin: '10px 0' }} />

                <div className="flex justify-between" style={{ fontSize: '12px', color: '#6E7681' }}>
                  <span>Abo-ID</span>
                  <span style={{ color: '#F0F6FC', fontFamily: 'var(--font-mono)' }}>
                    {success.subId}
                  </span>
                </div>
              </div>

              <div style={{ height: '16px' }} />

              <div
                className="w-full rounded-lg px-3 py-2.5"
                style={{
                  background: 'rgba(255, 180, 0, 0.06)',
                  border: '1px solid rgba(255, 180, 0, 0.12)',
                }}
              >
                <p style={{ fontSize: '11px', color: '#FFB400', lineHeight: 1.5 }}>
                  Speichere dein Passwort! Du erhältst es später auch per E-Mail.
                </p>
              </div>

              <div style={{ height: '24px' }} />

              <a
                href="/login"
                className={cn(
                  'w-full h-12 rounded-xl text-sm font-semibold relative overflow-hidden',
                  'transition-all duration-200 flex items-center justify-center gap-2',
                  'hover:brightness-105 hover:-translate-y-px',
                )}
                style={{
                  background: '#5CB8F0',
                  color: '#0A0D12',
                  boxShadow:
                    '0 0 24px rgba(92,184,240,0.15), 0 4px 12px rgba(0,0,0,0.3)',
                  animation: 'checkoutPulseGlow 2s ease-in-out infinite',
                }}
              >
                Zum Dashboard
              </a>

              {/* 3 next-steps */}
              <div style={{ height: '20px' }} />
              <div className="w-full grid grid-cols-1 gap-2">
                <NextStepRow
                  icon={<LogIn size={14} style={{ color: '#5CB8F0' }} />}
                  label="Login"
                  value="app.arctis.io/login"
                />
                <NextStepRow
                  icon={<Mail size={14} style={{ color: '#5CB8F0' }} />}
                  label="Bestätigung"
                  value={success.loginEmail}
                />
                <NextStepRow
                  icon={<LifeBuoy size={14} style={{ color: '#5CB8F0' }} />}
                  label="Support"
                  value="support@arctis.io"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="form">
              {/* --- Logo --- */}
              <div className="flex flex-col items-center" style={{ paddingTop: '8px' }}>
                <div style={{ animation: 'checkoutLogoPulse 6s ease-in-out infinite' }}>
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(92,184,240,0.25))' }}
                  >
                    <line x1="24" y1="4" x2="24" y2="44" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    <line x1="4" y1="24" x2="44" y2="24" stroke="#5CB8F0" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    <line x1="9.9" y1="9.9" x2="38.1" y2="38.1" stroke="#5CB8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                    <line x1="38.1" y1="9.9" x2="9.9" y2="38.1" stroke="#5CB8F0" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                    <circle cx="24" cy="24" r="16" stroke="#5CB8F0" strokeWidth="0.8" fill="none" opacity="0.25" />
                    <circle cx="24" cy="24" r="3" fill="#5CB8F0" opacity="0.9" />
                    <circle cx="24" cy="24" r="6" stroke="#5CB8F0" strokeWidth="0.8" fill="none" opacity="0.3" />
                  </svg>
                </div>
                <span
                  className="font-semibold"
                  style={{ marginTop: '4px', fontSize: '14px', color: '#5CB8F0', letterSpacing: '0.25em' }}
                >
                  ARCTIS
                </span>
                <span style={{ marginTop: '2px', fontSize: '10px', color: '#3D444D', letterSpacing: '0.1em' }}>
                  Checkout
                </span>
              </div>

              <div style={{ height: '24px' }} />

              {/* --- Order summary bar --- */}
              <div
                className="w-full rounded-xl px-4 py-3 flex items-center justify-between"
                style={{
                  background: 'rgba(92,184,240,0.04)',
                  border: '1px solid rgba(92,184,240,0.10)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                      width: 36, height: 36,
                      background: 'rgba(92,184,240,0.10)',
                    }}
                  >
                    <Sparkles size={16} style={{ color: '#5CB8F0' }} />
                  </div>
                  <div>
                    <span className="block font-semibold" style={{ fontSize: '13px', color: '#F0F6FC' }}>
                      Arctis Pro
                    </span>
                    <span className="block" style={{ fontSize: '11px', color: '#6E7681' }}>
                      Vollzugang aller Analyse-Module
                    </span>
                  </div>
                </div>
                <span
                  className="font-semibold tabular-nums"
                  style={{
                    fontSize: '15px',
                    color: '#5CB8F0',
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    overflow: 'hidden',
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={plan}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'inline-block' }}
                    >
                      {plan === 'annual' ? '39€' : '49€'}
                    </motion.span>
                  </AnimatePresence>
                  <span style={{ fontSize: '11px', color: '#6E7681', marginLeft: 2 }}>/Mo</span>
                </span>
              </div>

              {/* --- Sichere Zahlung badge --- */}
              <div
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg"
                style={{
                  marginTop: '12px',
                  background: 'rgba(52,211,153,0.04)',
                  border: '1px solid rgba(52,211,153,0.10)',
                }}
              >
                <Lock size={13} style={{ color: '#34D399' }} />
                <span style={{ fontSize: '12px', color: '#34D399', fontWeight: 600 }}>
                  Sichere Zahlung
                </span>
                <span style={{ fontSize: '10px', color: '#6E7681' }}>
                  &mdash; 256-bit SSL verschlüsselt
                </span>
              </div>

              {/* --- 14-day money-back guarantee --- */}
              <div
                className="w-full flex items-start gap-2.5 py-3 px-3 rounded-lg"
                style={{
                  marginTop: '10px',
                  background: 'rgba(92,184,240,0.04)',
                  border: '1px solid rgba(92,184,240,0.12)',
                }}
              >
                <Shield size={14} style={{ color: '#5CB8F0', marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '12px', color: '#F0F6FC', fontWeight: 600 }}>
                    14 Tage Geld-zurück-Garantie
                  </div>
                  <div style={{ fontSize: '11px', color: '#6E7681', marginTop: 2, lineHeight: 1.4 }}>
                    Nicht überzeugt? Volle Rückerstattung innerhalb von 14 Tagen — eine Email genügt.
                  </div>
                </div>
              </div>

              <div style={{ height: '24px' }} />

              {/* --- Global Error --- */}
              <AnimatePresence>
                {globalError && (
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
                        color: '#F87171',
                        background: 'rgba(248, 113, 113, 0.06)',
                        border: '1px solid rgba(248, 113, 113, 0.12)',
                      }}
                    >
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{globalError}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} noValidate>
                {/* --- Section 1: Dein Plan --- */}
                <SectionLabel>Dein Plan</SectionLabel>
                <div style={{ height: '12px' }} />

                <div className="flex gap-3">
                  <PlanButton
                    active={plan === 'annual'}
                    onClick={() => setPlan('annual')}
                    label="Jährlich"
                    detail="39€/Mo"
                    badge="Empfohlen"
                  />
                  <PlanButton
                    active={plan === 'monthly'}
                    onClick={() => setPlan('monthly')}
                    label="Monatlich"
                    detail="49€/Mo"
                  />
                </div>

                <div style={{ height: '8px' }} />

                <div
                  className="rounded-lg px-3 py-2 text-center"
                  style={{
                    background: plan === 'annual' ? 'rgba(52,211,153,0.06)' : 'rgba(22, 28, 38, 0.5)',
                    border: `1px solid ${plan === 'annual' ? 'rgba(52,211,153,0.12)' : 'rgba(92,184,240,0.06)'}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: plan === 'annual' ? '#34D399' : '#6E7681',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {planInfo.total}
                  </span>
                </div>

                {/* --- Divider --- */}
                <div style={{ height: '24px' }} />
                <div aria-hidden="true" style={{ height: '1px', background: 'rgba(92,184,240,0.06)' }} />
                <div style={{ height: '24px' }} />

                {/* --- Section 2: Persönliche Daten --- */}
                <SectionLabel>Persönliche Daten</SectionLabel>
                <div style={{ height: '12px' }} />

                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup
                    id="checkout-firstname"
                    label="Vorname"
                    value={form.firstName}
                    onChange={(v) => updateField('firstName', v)}
                    error={errors.firstName}
                    placeholder="Max"
                    autoComplete="given-name"
                    shakeKey={shakeKey}
                  />
                  <FieldGroup
                    id="checkout-lastname"
                    label="Nachname"
                    value={form.lastName}
                    onChange={(v) => updateField('lastName', v)}
                    error={errors.lastName}
                    placeholder="Mustermann"
                    autoComplete="family-name"
                    shakeKey={shakeKey}
                  />
                </div>

                <div style={{ height: '14px' }} />

                <FieldGroup
                  id="checkout-email"
                  label="E-Mail"
                  type="email"
                  value={form.email}
                  onChange={(v) => updateField('email', v)}
                  error={errors.email}
                  placeholder="name@beispiel.de"
                  autoComplete="email"
                  shakeKey={shakeKey}
                  adornmentWidthPx={18}
                  adornment={
                    <AnimatePresence>
                      {emailValid && (
                        <motion.span
                          key="email-ok"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center"
                        >
                          <CheckCircle2 size={16} style={{ color: '#34D399' }} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  }
                />

                {/* --- Divider --- */}
                <div style={{ height: '24px' }} />
                <div aria-hidden="true" style={{ height: '1px', background: 'rgba(92,184,240,0.06)' }} />
                <div style={{ height: '24px' }} />

                {/* --- Section 3: Zahlungsdaten --- */}
                <SectionLabel>Zahlungsdaten</SectionLabel>
                <div style={{ height: '12px' }} />

                {/* Payment method toggle — segmented with motion.layoutId */}
                <div
                  role="tablist"
                  aria-label="Zahlungsmethode"
                  className="relative flex gap-1 rounded-lg p-1"
                  style={{
                    marginBottom: '16px',
                    background: 'rgba(22, 28, 38, 0.6)',
                    border: '1px solid rgba(92,184,240,0.08)',
                  }}
                >
                  {(
                    [
                      { key: 'sepa' as const, label: 'SEPA-Lastschrift' },
                      { key: 'credit_card' as const, label: 'Kreditkarte' },
                    ]
                  ).map((tab) => {
                    const active = paymentMethod === tab.key
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setPaymentMethod(tab.key)}
                        className="relative flex-1 rounded-md px-3 py-2 text-center cursor-pointer transition-colors duration-200"
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: active ? '#F0F6FC' : '#6E7681',
                          background: 'transparent',
                          zIndex: 1,
                        }}
                      >
                        {active && (
                          <motion.span
                            layoutId="checkout-payment-tab"
                            className="absolute inset-0 rounded-md"
                            aria-hidden="true"
                            style={{
                              background: 'rgba(92,184,240,0.12)',
                              border: '1px solid rgba(92,184,240,0.30)',
                              boxShadow: '0 0 16px rgba(92,184,240,0.08)',
                              zIndex: -1,
                            }}
                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className="relative">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {paymentMethod === 'sepa' ? (
                    <motion.div
                      key="sepa"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <FieldGroup
                        id="checkout-iban"
                        label="IBAN"
                        value={form.iban}
                        onChange={handleIBANChange}
                        error={errors.iban}
                        placeholder="DE00 0000 0000 0000 0000 00"
                        autoComplete="off"
                        mono
                        sensitive
                        shakeKey={shakeKey}
                        adornmentWidthPx={28}
                        adornment={
                          <AnimatePresence>
                            {ibanIsDE && (
                              <motion.span
                                key="iban-de"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center rounded px-1.5 py-0.5"
                                style={{
                                  background: 'rgba(92,184,240,0.12)',
                                  border: '1px solid rgba(92,184,240,0.25)',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  letterSpacing: '0.08em',
                                  color: '#5CB8F0',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                DE
                              </motion.span>
                            )}
                          </AnimatePresence>
                        }
                      />

                      <div style={{ height: '14px' }} />

                      <FieldGroup
                        id="checkout-account-holder"
                        label="Kontoinhaber"
                        value={form.accountHolder}
                        onChange={(v) => updateField('accountHolder', v)}
                        error={errors.accountHolder}
                        placeholder="Max Mustermann"
                        autoComplete="name"
                        shakeKey={shakeKey}
                      />

                      <div style={{ height: '14px' }} />

                      {/* SEPA consent checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={form.sepaConsent}
                          onChange={(e) => updateField('sepaConsent', e.target.checked)}
                          className="mt-0.5 accent-[#5CB8F0] cursor-pointer"
                          style={{ width: 16, height: 16 }}
                        />
                        <span style={{ fontSize: '12px', color: '#6E7681', lineHeight: 1.5 }}>
                          Ich ermächtige Arctis, Zahlungen von meinem Konto mittels
                          SEPA-Lastschrift einzuziehen.
                        </span>
                      </label>
                      {errors.sepaConsent && (
                        <p role="alert" style={{ fontSize: '11px', color: '#F87171', marginTop: '6px' }}>
                          {errors.sepaConsent}
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="credit_card"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <FieldGroup
                        id="checkout-card-number"
                        label="Kartennummer"
                        value={form.cardNumber}
                        onChange={handleCardNumberChange}
                        error={errors.cardNumber}
                        placeholder="0000 0000 0000 0000"
                        autoComplete="cc-number"
                        mono
                        sensitive
                        shakeKey={shakeKey}
                        adornmentWidthPx={cardBrand ? (cardBrand === 'mastercard' ? 70 : 44) : 0}
                        adornment={
                          <AnimatePresence>
                            {cardBrand && (
                              <motion.span
                                key={`brand-${cardBrand}`}
                                initial={{ opacity: 0, scale: 0.8, y: -2 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -2 }}
                                transition={{ duration: 0.2 }}
                                className="rounded px-1.5 py-0.5"
                                style={{
                                  background: 'rgba(92,184,240,0.10)',
                                  border: '1px solid rgba(92,184,240,0.22)',
                                  fontSize: '9px',
                                  fontWeight: 700,
                                  letterSpacing: '0.08em',
                                  color: '#5CB8F0',
                                  fontFamily: 'var(--font-mono)',
                                }}
                              >
                                {CARD_BRAND_LABEL[cardBrand]}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        }
                      />

                      <div style={{ height: '14px' }} />

                      <div className="grid grid-cols-2 gap-3">
                        <FieldGroup
                          id="checkout-card-expiry"
                          label="Ablaufdatum"
                          value={form.cardExpiry}
                          onChange={handleCardExpiryChange}
                          error={errors.cardExpiry}
                          placeholder="MM/YY"
                          autoComplete="cc-exp"
                          mono
                          shakeKey={shakeKey}
                        />
                        <FieldGroup
                          id="checkout-card-cvv"
                          label="CVV"
                          type="password"
                          value={form.cardCvv}
                          onChange={handleCardCvvChange}
                          error={errors.cardCvv}
                          placeholder="000"
                          autoComplete="cc-csc"
                          mono
                          maxLength={3}
                          sensitive
                          shakeKey={shakeKey}
                        />
                      </div>

                      <div style={{ height: '14px' }} />

                      <FieldGroup
                        id="checkout-card-holder"
                        label="Karteninhaber"
                        value={form.cardHolder}
                        onChange={(v) => updateField('cardHolder', v)}
                        error={errors.cardHolder}
                        placeholder="Max Mustermann"
                        autoComplete="cc-name"
                        shakeKey={shakeKey}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* --- Divider --- */}
                <div style={{ height: '24px' }} />
                <div aria-hidden="true" style={{ height: '1px', background: 'rgba(92,184,240,0.06)' }} />
                <div style={{ height: '24px' }} />

                {/* --- Section 4: Zusammenfassung --- */}
                <SectionLabel>Zusammenfassung</SectionLabel>
                <div style={{ height: '12px' }} />

                <div
                  className="rounded-xl px-4 py-3 flex flex-col gap-2.5"
                  style={{
                    background: 'rgba(22, 28, 38, 0.8)',
                    border: '1px solid rgba(92,184,240,0.08)',
                  }}
                >
                  <SummaryRow
                    label="Plan"
                    value={`Arctis Pro — ${planInfo.interval}`}
                  />
                  <SummaryRow
                    label="Preis"
                    value={
                      plan === 'annual'
                        ? '39€/Mo (468€/Jahr, spare 120€)'
                        : '49€/Mo'
                    }
                    mono
                  />
                  <SummaryRow
                    label="Nächste Abbuchung"
                    value={nextBilling}
                    mono
                  />
                </div>

                <div style={{ height: '24px' }} />

                {/* --- Submit --- */}
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className={cn(
                    'w-full h-12 rounded-xl text-sm font-semibold relative overflow-hidden',
                    'transition-all duration-200 flex items-center justify-center gap-2',
                    'disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer',
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
                    if (!isLoading) {
                      e.currentTarget.style.boxShadow =
                        '0 0 40px rgba(92,184,240,0.30), 0 6px 20px rgba(0,0,0,0.4)'
                      // Trigger hover shimmer
                      const shimmer = e.currentTarget.querySelector('[data-shimmer]') as HTMLElement | null
                      if (shimmer) shimmer.style.transform = 'translateX(100%)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      '0 0 24px rgba(92,184,240,0.15), 0 4px 12px rgba(0,0,0,0.3)'
                    const shimmer = e.currentTarget.querySelector('[data-shimmer]') as HTMLElement | null
                    if (shimmer) shimmer.style.transform = 'translateX(-100%)'
                  }}
                >
                  {/* Hover shimmer overlay */}
                  <span
                    data-shimmer=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    style={{
                      transition: 'transform 0.7s ease-out',
                    }}
                  />
                  {/* Loading shimmer sweep */}
                  {isLoading && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)',
                        animation: 'checkoutSubmitSweep 1.2s linear infinite',
                      }}
                    />
                  )}
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Wird verarbeitet…</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} aria-hidden="true" />
                      <span>Kostenpflichtig abonnieren</span>
                    </>
                  )}
                </button>

                {/* Trust-signal row — payment method logos */}
                <div style={{ height: '12px' }} />
                <div className="flex items-center justify-center gap-2">
                  <span style={{ fontSize: '10px', color: '#6E7681', marginRight: 4 }}>
                    Bezahlt mit
                  </span>
                  {['VISA', 'MASTERCARD', 'SEPA'].map((b) => (
                    <span
                      key={b}
                      className="rounded px-1.5 py-0.5 tabular-nums"
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#6E7681',
                        background: 'rgba(92,184,240,0.04)',
                        border: '1px solid rgba(92,184,240,0.08)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <div style={{ height: '6px' }} />
                <p
                  className="text-center"
                  style={{ fontSize: '10px', color: '#3D444D', letterSpacing: '0.02em' }}
                >
                  Kein Abo-Kleingedrucktes · Jederzeit kündbar
                </p>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-medium"
      style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: '#5CB8F0',
      }}
    >
      {children}
    </p>
  )
}

interface PlanButtonProps {
  active: boolean
  onClick: () => void
  label: string
  detail: string
  badge?: string
}

function PlanButton({ active, onClick, label, detail, badge }: PlanButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-xl px-5 py-4 text-left cursor-pointer relative',
        'transition-all duration-300 ease-out',
        active && 'scale-[1.02]',
      )}
      style={{
        background: active ? 'rgba(92,184,240,0.10)' : 'rgba(22, 28, 38, 0.5)',
        border: `1.5px solid ${active ? 'rgba(92,184,240,0.35)' : 'rgba(92,184,240,0.06)'}`,
        boxShadow: active
          ? '0 0 24px rgba(92,184,240,0.08), inset 0 1px 0 rgba(92,184,240,0.1)'
          : 'none',
      }}
    >
      {badge && active && (
        <span
          className="absolute -top-2.5 right-3 rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wide"
          style={{
            background: '#5CB8F0',
            color: '#0A0D12',
            animation: 'checkoutBadgePulseOnce 1.2s ease-out 0.2s 1',
          }}
        >
          {badge}
        </span>
      )}
      {/* Selection indicator dot */}
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 rounded-full transition-all duration-300"
          style={{
            width: 18,
            height: 18,
            border: `2px solid ${active ? '#5CB8F0' : 'rgba(92,184,240,0.15)'}`,
            background: active ? '#5CB8F0' : 'transparent',
            boxShadow: active ? '0 0 8px rgba(92,184,240,0.4), inset 0 0 0 3px #0A0D12' : 'none',
          }}
        />
        <div>
          <span
            className="block font-semibold transition-colors duration-300"
            style={{ fontSize: '14px', color: active ? '#F0F6FC' : '#6E7681' }}
          >
            {label}
          </span>
          <span
            className="block transition-colors duration-300"
            style={{ fontSize: '13px', color: active ? '#5CB8F0' : '#3D444D', fontFamily: 'var(--font-mono)' }}
          >
            {detail}
          </span>
        </div>
      </div>
    </button>
  )
}

interface FieldGroupProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  type?: string
  autoComplete?: string
  mono?: boolean
  maxLength?: number
  sensitive?: boolean
  adornment?: React.ReactNode
  adornmentWidthPx?: number
  shakeKey?: number
}

function FieldGroup({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = 'text',
  autoComplete,
  mono,
  maxLength,
  sensitive,
  adornment,
  adornmentWidthPx,
  shakeKey,
}: FieldGroupProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const prevErrorRef = useRef<string | undefined>(error)
  const prevShakeKeyRef = useRef(shakeKey ?? 0)

  // Trigger shake on first-show of this field's error
  useEffect(() => {
    const hadErrorBefore = Boolean(prevErrorRef.current)
    const hasErrorNow = Boolean(error)
    const globalBumped = (shakeKey ?? 0) !== prevShakeKeyRef.current
    if (hasErrorNow && (!hadErrorBefore || globalBumped)) {
      const el = inputRef.current
      if (el) {
        el.setAttribute('data-shake', 'true')
        const t = setTimeout(() => el.removeAttribute('data-shake'), 420)
        return () => clearTimeout(t)
      }
    }
    prevErrorRef.current = error
    prevShakeKeyRef.current = shakeKey ?? 0
  }, [error, shakeKey])

  const padRight = adornment ? Math.max(36, (adornmentWidthPx ?? 0) + 16) : undefined
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-medium"
        style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#6E7681',
          marginBottom: '6px',
        }}
      >
        <span className="flex items-center gap-1.5">
          {sensitive && (
            <Lock size={9} style={{ color: '#34D399', opacity: 0.6 }} />
          )}
          {label}
        </span>
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={type}
          className="w-full h-11 rounded-lg text-[13px] transition-all duration-200"
          style={{
            background: 'rgba(22, 28, 38, 0.8)',
            border: `1px solid ${error ? 'rgba(248, 113, 113, 0.4)' : 'rgba(92,184,240,0.08)'}`,
            color: '#F0F6FC',
            fontFamily: mono ? 'var(--font-mono)' : undefined,
            paddingLeft: '14px',
            paddingRight: padRight ? `${padRight}px` : '14px',
          }}
          data-error={error ? 'true' : 'false'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {adornment && (
          <div
            aria-hidden="true"
            className="absolute top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
            style={{ right: 10 }}
          >
            {adornment}
          </div>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          style={{ fontSize: '11px', color: '#F87171', marginTop: '4px' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function NextStepRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-3 py-2"
      style={{
        background: 'rgba(22, 28, 38, 0.6)',
        border: '1px solid rgba(92,184,240,0.06)',
      }}
    >
      <div
        className="flex items-center justify-center rounded-md shrink-0"
        style={{
          width: 28,
          height: 28,
          background: 'rgba(92,184,240,0.08)',
          border: '1px solid rgba(92,184,240,0.12)',
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 text-left">
        <div style={{ fontSize: '10px', color: '#6E7681', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div
          className="truncate"
          style={{
            fontSize: '12px',
            color: '#F0F6FC',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-4" style={{ fontSize: '12px' }}>
      <span style={{ color: '#6E7681' }}>{label}</span>
      <span
        className="text-right tabular-nums"
        style={{
          color: '#F0F6FC',
          fontWeight: 500,
          fontFamily: mono ? 'var(--font-mono)' : undefined,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  )
}

