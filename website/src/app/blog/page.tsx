import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { BlogFilter } from '@/components/blog/BlogFilter'
import { getAllPosts } from '@/lib/blog'

// ─── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Trading insights, platform updates, and analysis deep dives from the Arctis team. Directional bias, confluence scoring, latency architecture, and more.',
  openGraph: {
    title: 'Blog',
    description:
      'Trading insights, platform updates, and analysis deep dives from the Arctis team.',
    url: 'https://arctis.trade/blog',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog',
    description:
      'Trading insights, platform updates, and analysis deep dives from the Arctis team.',
  },
}

// ─── Blog Listing Page ─────────────────────────────────────────────────────────

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = Array.from(new Set(posts.map((p) => p.category)))

  return (
    <div className="bg-arctic-base min-h-screen">
      <Navbar />

      {/* Hero banner */}
      <section className="bg-arctic-primary border-b border-frost-border-subtle py-20">
        <div className="section-container text-center">
          <div className="inline-block bg-ice-muted text-ice text-xs font-medium px-3 py-1 rounded-full mb-6">
            Arctis Blog
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-frost-white mb-4">
            Insights &amp; Analysis
          </h1>
          <p className="text-frost-secondary text-lg max-w-xl mx-auto leading-relaxed">
            Trading insights, platform updates, and analysis deep dives — written for futures
            traders who demand precision.
          </p>
        </div>
      </section>

      {/* Blog content */}
      <section className="section-container py-16">
        <BlogFilter posts={posts} categories={categories} />
      </section>

      <Footer />
    </div>
  )
}
