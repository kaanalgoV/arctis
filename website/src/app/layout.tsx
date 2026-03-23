import type { Metadata } from 'next'
import { Syne, Outfit } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: {
    default: 'Arctis — Precision Trading Analysis',
    template: '%s | Arctis',
  },
  description:
    'Professional-grade trading analysis platform. Real-time market intelligence, pattern detection, and directional bias — engineered for futures traders who demand precision.',
  keywords: [
    'trading platform',
    'futures trading',
    'market analysis',
    'real-time data',
    'NQ futures',
    'ES futures',
    'trading software',
    'technical analysis',
    'pattern detection',
    'trading tools',
  ],
  authors: [{ name: 'Arctis', url: 'https://arctis.trade' }],
  creator: 'Arctis',
  openGraph: {
    title: 'Arctis — Precision Trading Analysis',
    description:
      'Professional-grade trading analysis platform for futures traders. Real-time intelligence, pattern detection, and directional bias.',
    url: 'https://arctis.trade',
    siteName: 'Arctis',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arctis — Precision Trading Analysis',
    description:
      'Professional-grade trading analysis platform for futures traders.',
    creator: '@arctis_trade',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://arctis.trade'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${syne.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
