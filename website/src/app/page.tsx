import dynamic from 'next/dynamic'
import { OrganizationJsonLd, SoftwareApplicationJsonLd } from '@/components/seo/JsonLd'
import { Navbar } from '@/components/layout/Navbar'
import { Hero } from '@/components/sections/Hero'
import { TrustBar } from '@/components/sections/TrustBar'
import { Features } from '@/components/sections/Features'
import { Pricing } from '@/components/sections/Pricing'
import { SectionDivider } from '@/components/effects/SectionDivider'
import { ScrollProgress } from '@/components/effects/ScrollProgress'
import { ParallaxBlobs } from '@/components/effects/ParallaxBlobs'

const EngineShowcase = dynamic(() => import('@/components/sections/EngineShowcase').then(m => ({ default: m.EngineShowcase })))
const ProductShowcase = dynamic(() => import('@/components/sections/ProductShowcase').then(m => ({ default: m.ProductShowcase })))
const ReplayShowcase = dynamic(() => import('@/components/sections/ReplayShowcase').then(m => ({ default: m.ReplayShowcase })))
const SignalShowcase = dynamic(() => import('@/components/sections/SignalShowcase').then(m => ({ default: m.SignalShowcase })))
const Comparison = dynamic(() => import('@/components/sections/Comparison').then(m => ({ default: m.Comparison })))
const Testimonials = dynamic(() => import('@/components/sections/Testimonials').then(m => ({ default: m.Testimonials })))
const FAQ = dynamic(() => import('@/components/sections/FAQ').then(m => ({ default: m.FAQ })))
const FinalCTA = dynamic(() => import('@/components/sections/FinalCTA').then(m => ({ default: m.FinalCTA })))
const Footer = dynamic(() => import('@/components/layout/Footer').then(m => ({ default: m.Footer })))

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <ParallaxBlobs />
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <ScrollProgress />
      <Navbar />
      <Hero />
      <SectionDivider />
      <TrustBar />
      <SectionDivider />
      <EngineShowcase />
      <SectionDivider glow />
      <Features />
      <SectionDivider glow />
      <ProductShowcase />
      <SectionDivider />
      <ReplayShowcase />
      <SectionDivider />
      <SignalShowcase />
      <SectionDivider glow />
      <Comparison />
      <SectionDivider />
      <Testimonials />
      <SectionDivider glow />
      <Pricing />
      <SectionDivider />
      <FAQ />
      <SectionDivider glow />
      <FinalCTA />
      <Footer />
    </main>
  )
}
