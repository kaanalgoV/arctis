/**
 * Central source of truth for the URLs that point at the Arctis **application**
 * (the trading app at app.arctis.app / localhost:5174), not the marketing site.
 *
 * In local development the `app.arctis.app` domain can't be resolved, so we
 * fall back to the Vite dev server on localhost:5174. In production a build
 * env var overrides both.
 */

const PROD_APP_URL = 'https://app.arctis.app'
const DEV_APP_URL = 'http://localhost:5174'

function resolveAppBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  if (envUrl && envUrl.length > 0) return envUrl.replace(/\/$/, '')
  // NODE_ENV is baked in at build time by Next; 'development' means `next dev`.
  if (process.env.NODE_ENV === 'development') return DEV_APP_URL
  return PROD_APP_URL
}

export const APP_BASE_URL = resolveAppBase()

export const LOGIN_URL = `${APP_BASE_URL}/login`
export const CHECKOUT_URL = `${APP_BASE_URL}/checkout`
